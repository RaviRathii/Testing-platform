import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const tests = await prisma.mockTest.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { questions: true } },
      attempts: {
        where: { userId: user.id },
        select: { score: true },
      },
    },
  });

  return NextResponse.json(
    tests.map((test) => ({
      id: test.id,
      title: test.title,
      examName: test.examName,
      description: test.description,
      durationMinutes: test.durationMinutes,
      questionCount: test._count.questions,
      attemptCount: test.attempts.length,
      bestScore: test.attempts.length ? Math.max(...test.attempts.map((attempt) => attempt.score)) : null,
    })),
  );
}
