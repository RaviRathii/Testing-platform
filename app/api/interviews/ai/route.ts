import { NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropic } from "@/lib/ai-interviewer";
import { getCurrentUser } from "@/lib/auth";
import { interviewLevelKeys, interviewTrackKeys } from "@/lib/interviews";
import { interviewUsageToday } from "@/lib/interview-sessions";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  track: z.enum(interviewTrackKeys as [string, ...string[]]),
  level: z.enum(interviewLevelKeys as [string, ...string[]]),
});

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const sessions = await prisma.interviewSession.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, track: true, level: true, status: true, overallScore: true, createdAt: true, completedAt: true },
  });

  return NextResponse.json({ aiConfigured: getAnthropic() !== null, sessions, usage: await interviewUsageToday(user) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Log in to start an AI interview." }, { status: 401 });
  }

  if (!getAnthropic()) {
    return NextResponse.json({ error: "AI interviews aren't available yet. Please try again later." }, { status: 503 });
  }

  const usage = await interviewUsageToday(user);
  if (usage.remaining === 0) {
    return NextResponse.json(
      {
        error: `You've used all ${usage.limit} of today's AI interviews. You can start another after midnight IST, or resume one you've already started.`,
        usage,
      },
      { status: 429 },
    );
  }

  const payload = createSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "Choose an interview type and level." }, { status: 400 });
  }

  const session = await prisma.interviewSession.create({
    data: {
      userId: user.id,
      track: payload.data.track as "DSA" | "SYSTEM_DESIGN" | "DEVELOPMENT",
      level: payload.data.level as "JUNIOR" | "MID" | "SENIOR",
      messages: [],
    },
  });

  return NextResponse.json({ id: session.id }, { status: 201 });
}
