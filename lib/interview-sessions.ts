import { dailyInterviewLimit, type TranscriptMessage } from "@/lib/ai-interviewer";
import { istDateKey, istSlotToDate } from "@/lib/interviews";
import { prisma } from "@/lib/prisma";

export const isObjectId = (id: string) => /^[0-9a-f]{24}$/i.test(id);

/** Loads an interview session only if it belongs to the given user. */
export async function findOwnedSession(id: string, userId: string) {
  if (!isObjectId(id)) {
    return null;
  }

  const session = await prisma.interviewSession.findFirst({ where: { id, userId } });
  return session ? { ...session, transcript: (session.messages ?? []) as TranscriptMessage[] } : null;
}

export type InterviewUsage = {
  /** Null when the user has no limit (admins). */
  limit: number | null;
  used: number;
  remaining: number | null;
  /** When the count resets: the next midnight IST. */
  resetsAt: string;
};

/** How many AI interviews the user has started today (IST) against their daily limit. */
export async function interviewUsageToday(user: { id: string; isAdmin: boolean }, now = new Date()): Promise<InterviewUsage> {
  const startOfToday = istSlotToDate(istDateKey(now), 0);
  const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  const used = await prisma.interviewSession.count({
    where: { userId: user.id, createdAt: { gte: startOfToday } },
  });

  const limit = user.isAdmin ? null : dailyInterviewLimit();
  return {
    limit,
    used,
    remaining: limit === null ? null : Math.max(0, limit - used),
    resetsAt: startOfTomorrow.toISOString(),
  };
}
