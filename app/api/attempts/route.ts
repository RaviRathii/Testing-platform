import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const attemptAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedOption: z.number().int().min(0).max(3),
});

const attemptSubmissionSchema = z.object({
  answers: z.array(attemptAnswerSchema).min(1),
  mockTestId: z.string().optional(),
});

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login required to view results." }, { status: 401 });
  }

  const attempts = await prisma.quizAttempt.findMany({
    where: { userId: user.id },
    orderBy: { submittedAt: "desc" },
    include: {
      mockTest: true,
    },
  });

  const summary = attempts.length
    ? {
        totalAttempts: attempts.length,
        averageScore: Math.round(
          attempts.reduce((total, attempt) => total + attempt.score, 0) / attempts.length,
        ),
        bestScore: Math.max(...attempts.map((attempt) => attempt.score)),
        latestScore: attempts[0].score,
        lastAttemptAt: attempts[0].submittedAt ?? attempts[0].startedAt,
      }
    : {
        totalAttempts: 0,
        averageScore: 0,
        bestScore: 0,
        latestScore: 0,
        lastAttemptAt: null,
      };

  return NextResponse.json({
    summary,
    attempts: attempts.map((attempt) => ({
      id: attempt.id,
      title: attempt.mockTest?.title ?? "Practice Session",
      examName: attempt.mockTest?.examName ?? "General Practice",
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      correctAnswers: attempt.correctAnswers,
      submittedAt: attempt.submittedAt ?? attempt.startedAt,
      createdAt: attempt.startedAt,
    })),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login required to attempt a mock test." }, { status: 401 });
  }

  const body = await request.json();
  const payload = attemptSubmissionSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Answer payload is invalid." }, { status: 400 });
  }

  const subscription =
    user.subscription ??
    (await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: "FREE",
        status: "ACTIVE",
        startsAt: new Date(),
      },
    }));

  if (subscription.status !== "ACTIVE") {
    return NextResponse.json(
      {
        error: "Active subscription required to attempt questions.",
      },
      { status: 403 },
    );
  }

  let questionIdsToValidate = [...new Set(payload.data.answers.map((answer) => answer.questionId))];

  if (payload.data.mockTestId) {
    const mockTest = await prisma.mockTest.findUnique({
      where: { id: payload.data.mockTestId },
      include: { questions: { include: { question: true } } },
    });

    if (!mockTest) {
      return NextResponse.json({ error: "Selected mock test not found." }, { status: 404 });
    }

    const validQuestionIds = mockTest.questions.map((item) => item.questionId);
    questionIdsToValidate = [...new Set(validQuestionIds)];
  }

  const questions = await prisma.question.findMany({
    where: {
      id: { in: questionIdsToValidate },
      isActive: true,
    },
  });

  const missingQuestionIds = questionIdsToValidate.filter(
    (questionId) => !questions.some((question) => question.id === questionId),
  );

  if (missingQuestionIds.length > 0) {
    return NextResponse.json(
      {
        error: "Some selected questions are invalid or unavailable.",
        missingQuestionIds,
      },
      { status: 400 },
    );
  }

  const questionMap = new Map(questions.map((question) => [question.id, question]));

  let correctAnswers = 0;
  const answerRecords = payload.data.answers
    .filter((answer) => questionMap.has(answer.questionId))
    .map((answer) => {
    const question = questionMap.get(answer.questionId);
    const isCorrect = question ? question.correctOption === answer.selectedOption : false;

    if (isCorrect) {
      correctAnswers += 1;
    }

      return {
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
        isCorrect,
      };
    });

  const totalQuestions = answerRecords.length || payload.data.answers.length;
  const score = totalQuestions === 0 ? 0 : Math.round((correctAnswers / totalQuestions) * 100);

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: user.id,
      mockTestId: payload.data.mockTestId ?? null,
      subscriptionId: subscription.id,
      totalQuestions,
      correctAnswers,
      score,
      answers: {
        create: answerRecords.map((record) => ({
          questionId: record.questionId,
          selectedOption: record.selectedOption,
          isCorrect: record.isCorrect,
        })),
      },
    },
    include: {
      answers: true,
    },
  });

  return NextResponse.json({
    attemptId: attempt.id,
    score,
    totalQuestions,
    correctAnswers,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    subscription: {
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
    },
  });
}
