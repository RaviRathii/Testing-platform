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
      questions: {
        include: {
          question: true,
        },
        orderBy: { questionOrder: "asc" },
      },
      createdBy: true,
    },
  });

  return NextResponse.json(
    tests.map((test) => ({
      id: test.id,
      title: test.title,
      examName: test.examName,
      description: test.description,
      durationMinutes: test.durationMinutes,
      questionCount: test.questions.length,
      createdBy: test.createdBy.name,
      questions: test.questions.map((item) => ({
        id: item.question.id,
        category: item.question.category,
        difficulty: item.question.difficulty,
        questionText: item.question.questionText,
        options: Array.isArray(item.question.options) ? (item.question.options as string[]) : [],
        explanation: item.question.explanation,
      })),
    })),
  );
}
