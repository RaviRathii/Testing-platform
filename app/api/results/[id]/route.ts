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
    return NextResponse.json({ error: "Login required to view results." }, { status: 401 });
  }

  const attempt = await prisma.quizAttempt.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      mockTest: true,
      answers: {
        include: {
          question: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Result not found." }, { status: 404 });
  }

  const categoryMap = new Map<string, { total: number; correct: number }>();

  const questionReview = attempt.answers.map((answer) => {
    const category = answer.question.category;
    const previous = categoryMap.get(category) ?? { total: 0, correct: 0 };

    categoryMap.set(category, {
      total: previous.total + 1,
      correct: previous.correct + (answer.isCorrect ? 1 : 0),
    });

    return {
      id: answer.id,
      questionId: answer.questionId,
      questionText: answer.question.questionText,
      category,
      difficulty: answer.question.difficulty,
      selectedOption: answer.selectedOption,
      correctOption: answer.question.correctOption,
      isCorrect: answer.isCorrect,
      options: Array.isArray(answer.question.options) ? (answer.question.options as string[]) : [],
      explanation: answer.question.explanation,
    };
  });

  const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    total: data.total,
    correct: data.correct,
    score: Math.round((data.correct / data.total) * 100),
  }));

  const examComparison = await prisma.quizAttempt.findMany({
    where: { userId: user.id },
    include: { mockTest: true },
    orderBy: { submittedAt: "asc" },
  });

  const examMap = new Map<string, number[]>();

  for (const item of examComparison) {
    const examName = item.mockTest?.examName ?? "General Practice";
    const list = examMap.get(examName) ?? [];
    list.push(item.score);
    examMap.set(examName, list);
  }

  const examBreakdown = Array.from(examMap.entries()).map(([examName, scores]) => ({
    examName,
    averageScore: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
    bestScore: Math.max(...scores),
    totalAttempts: scores.length,
  }));

  return NextResponse.json({
    attempt: {
      id: attempt.id,
      title: attempt.mockTest?.title ?? "Practice Session",
      examName: attempt.mockTest?.examName ?? "General Practice",
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      correctAnswers: attempt.correctAnswers,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt ?? attempt.startedAt,
      durationMinutes: attempt.mockTest?.durationMinutes ?? null,
    },
    conclusion: {
      percentage: attempt.score,
      correctAnswers: attempt.correctAnswers,
      totalQuestions: attempt.totalQuestions,
      passed: attempt.score >= 60,
    },
    categoryBreakdown,
    questionReview,
    examBreakdown,
  });
}
