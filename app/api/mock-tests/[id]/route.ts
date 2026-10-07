import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  if (!/^[0-9a-f]{24}$/i.test(id)) {
    return NextResponse.json({ error: "Mock test not found." }, { status: 404 });
  }

  const test = await prisma.mockTest.findUnique({
    where: { id },
    include: {
      questions: {
        include: { question: true },
        orderBy: { questionOrder: "asc" },
      },
    },
  });

  if (!test || (!test.isPublished && !user.isAdmin)) {
    return NextResponse.json({ error: "Mock test not found." }, { status: 404 });
  }

  // correctOption and explanation are deliberately left out; they are revealed on the results page.
  return NextResponse.json({
    id: test.id,
    title: test.title,
    examName: test.examName,
    description: test.description,
    durationMinutes: test.durationMinutes,
    questions: test.questions.map(({ question }) => ({
      id: question.id,
      category: question.category,
      difficulty: question.difficulty,
      questionText: question.questionText,
      options: Array.isArray(question.options) ? (question.options as string[]) : [],
    })),
  });
}
