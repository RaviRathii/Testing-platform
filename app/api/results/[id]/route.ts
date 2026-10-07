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
      mockTest: {
        include: {
          questions: {
            include: { question: true },
            orderBy: { questionOrder: "asc" },
          },
        },
      },
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

  const answerByQuestion = new Map(attempt.answers.map((answer) => [answer.questionId, answer]));
  // Mock test attempts are reviewed in test order, including skipped questions.
  const reviewedQuestions = attempt.mockTest
    ? attempt.mockTest.questions.map((item) => item.question)
    : attempt.answers.map((answer) => answer.question);

  const questionReview = reviewedQuestions.map((question) => {
    const answer = answerByQuestion.get(question.id);
    const isCorrect = answer?.isCorrect ?? false;
    const category = question.category;
    const previous = categoryMap.get(category) ?? { total: 0, correct: 0 };

    categoryMap.set(category, {
      total: previous.total + 1,
      correct: previous.correct + (isCorrect ? 1 : 0),
    });

    return {
      id: answer?.id ?? question.id,
      questionId: question.id,
      questionText: question.questionText,
      category,
      difficulty: question.difficulty,
      selectedOption: answer?.selectedOption ?? null,
      correctOption: question.correctOption,
      isCorrect,
      options: Array.isArray(question.options) ? (question.options as string[]) : [],
      explanation: question.explanation,
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
