import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { generateInterviewReport, getAnthropic, InterviewReportError } from "@/lib/ai-interviewer";
import { getCurrentUser } from "@/lib/auth";
import { findOwnedSession } from "@/lib/interview-sessions";
import { prisma } from "@/lib/prisma";

// Report generation runs at high effort and can take a while.
export const maxDuration = 300;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  if (session.status === "COMPLETED") {
    return NextResponse.json({ report: session.report });
  }

  const answers = session.transcript.filter((message) => message.role === "user" && !message.hidden).length;
  if (answers === 0) {
    return NextResponse.json({ error: "Answer at least one question before ending the interview." }, { status: 400 });
  }

  try {
    const report = await generateInterviewReport(anthropic, session.track, session.level, session.transcript);

    await prisma.interviewSession.update({
      where: { id: session.id },
      data: { status: "COMPLETED", report, overallScore: report.overallScore, completedAt: new Date() },
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error("AI interview report failed", error);
    const message =
      error instanceof InterviewReportError
        ? error.message
        : error instanceof Anthropic.RateLimitError
          ? "The feedback service is busy. Please try again in a minute."
          : "Couldn't generate your feedback report. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
