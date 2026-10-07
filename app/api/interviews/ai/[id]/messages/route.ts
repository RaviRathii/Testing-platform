import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAnthropic,
  MAX_CANDIDATE_MESSAGES,
  MAX_MESSAGE_CHARS,
  OPENING_PROMPT,
  streamInterviewerTurn,
  type TranscriptMessage,
} from "@/lib/ai-interviewer";
import { getCurrentUser } from "@/lib/auth";
import { findOwnedSession } from "@/lib/interview-sessions";
import { STREAM_ERROR_MARKER } from "@/lib/interviews";
import { prisma } from "@/lib/prisma";

const messageSchema = z.object({
  // Omitted to start the interview, or to retry a reply that failed to generate.
  content: z.string().trim().min(1).max(MAX_MESSAGE_CHARS).optional(),
});

function describeError(error: unknown) {
  if (error instanceof Anthropic.RateLimitError) {
    return "The interviewer is busy right now. Please wait a moment and retry.";
  }
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    return "AI interviews are misconfigured. Please contact support.";
  }
  if (error instanceof Anthropic.APIError && error.status !== undefined && error.status >= 500) {
    return "The interviewer had a temporary problem. Please retry.";
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return "Couldn't reach the interviewer. Please check your connection and retry.";
  }
  return "Something went wrong generating the reply. Please retry.";
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const anthropic = getAnthropic();
  if (!anthropic) {
    return NextResponse.json({ error: "AI interviews aren't available yet." }, { status: 503 });
  }

  const session = await findOwnedSession((await params).id, user.id);

  if (!session) {
    return NextResponse.json({ error: "Interview not found." }, { status: 404 });
  }

  if (session.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "This interview has already ended." }, { status: 409 });
  }

  const payload = messageSchema.safeParse(await request.json().catch(() => ({})));

  if (!payload.success) {
    return NextResponse.json(
      { error: `Your answer must be between 1 and ${MAX_MESSAGE_CHARS.toLocaleString()} characters.` },
      { status: 400 },
    );
  }

  const transcript: TranscriptMessage[] = [...session.transcript];
  const content = payload.data.content;
  const lastMessage = transcript.at(-1);

  if (content) {
    if (transcript.length === 0) {
      return NextResponse.json({ error: "The interview hasn't started yet." }, { status: 409 });
    }
    const candidateMessages = transcript.filter((message) => message.role === "user" && !message.hidden).length;
    if (candidateMessages >= MAX_CANDIDATE_MESSAGES) {
      return NextResponse.json(
        { error: "You've reached the message limit for this interview. End it to get your feedback." },
        { status: 409 },
      );
    }
    transcript.push({ role: "user", content });
  } else if (transcript.length === 0) {
    transcript.push({ role: "user", content: OPENING_PROMPT, hidden: true });
  } else if (lastMessage?.role !== "user") {
    // Nothing to answer: the interviewer already replied to the latest message.
    return NextResponse.json({ error: "Send an answer to continue." }, { status: 400 });
  }

  // Save the candidate's message first so it isn't lost if generation fails.
  await prisma.interviewSession.update({ where: { id: session.id }, data: { messages: transcript } });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let reply = "";
      try {
        const stream = streamInterviewerTurn(anthropic, session.track, session.level, transcript);

        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            reply += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        const message = await stream.finalMessage();
        if (message.stop_reason === "refusal") {
          // Even the fallback model declined; drop any partial text rather than saving it.
          controller.enqueue(
            encoder.encode(`${STREAM_ERROR_MARKER}The interviewer couldn't respond to that. Please rephrase your answer.`),
          );
          controller.close();
          return;
        }

        if (reply.trim()) {
          await prisma.interviewSession.update({
            where: { id: session.id },
            data: { messages: [...transcript, { role: "assistant", content: reply }] },
          });
        }
        controller.close();
      } catch (error) {
        console.error("AI interview turn failed", error);
        controller.enqueue(encoder.encode(`${STREAM_ERROR_MARKER}${describeError(error)}`));
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
