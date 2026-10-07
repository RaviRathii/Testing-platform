import { NextResponse } from "next/server";
import { getAnthropic, MAX_CANDIDATE_MESSAGES, MAX_MESSAGE_CHARS } from "@/lib/ai-interviewer";
import { getCurrentUser } from "@/lib/auth";
import { findOwnedSession } from "@/lib/interview-sessions";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const session = await findOwnedSession((await params).id, user.id);

  if (!session) {
    return NextResponse.json({ error: "Interview not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: session.id,
    track: session.track,
    level: session.level,
    status: session.status,
    messages: session.transcript.filter((message) => !message.hidden),
    report: session.report,
    createdAt: session.createdAt,
    completedAt: session.completedAt,
    aiConfigured: getAnthropic() !== null,
    limits: { maxCandidateMessages: MAX_CANDIDATE_MESSAGES, maxMessageChars: MAX_MESSAGE_CHARS },
  });
}
