import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockTestSchema = z.object({
  title: z.string().min(3),
  examName: z.string().min(2),
  description: z.string().optional(),
  durationMinutes: z.number().int().min(1).max(300).default(60),
  isPublished: z.boolean().default(false),
  questionIds: z.array(z.string()).min(1),
});

type QuestionSummary = {
  id: string;
  category: string;
  difficulty: string;
  questionText: string;
  options: unknown;
  correctOption: number;
  explanation?: string | null;
};

function mapQuestion(question: QuestionSummary) {
  return {
    id: question.id,
    category: question.category,
    difficulty: question.difficulty,
    questionText: question.questionText,
    options: Array.isArray(question.options) ? (question.options as string[]) : [],
    correctOption: question.correctOption,
    explanation: question.explanation,
  };
}

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const tests = await prisma.mockTest.findMany({
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
      isPublished: test.isPublished,
      createdBy: test.createdBy.name,
      questionCount: test.questions.length,
      questions: test.questions.map((item) => mapQuestion(item.question)),
    })),
  );
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const payload = mockTestSchema.safeParse(body);

    if (!payload.success) {
      return NextResponse.json({ error: "Mock test payload is invalid." }, { status: 400 });
    }

    const questionIds = [...new Set(payload.data.questionIds)];
    const existingQuestions = await prisma.question.findMany({
      where: {
        id: { in: questionIds },
        isActive: true,
      },
      select: { id: true },
    });

    if (existingQuestions.length !== questionIds.length) {
      return NextResponse.json({ error: "One or more selected questions are invalid." }, { status: 400 });
    }

    const mockTest = await prisma.mockTest.create({
      data: {
        title: payload.data.title,
        examName: payload.data.examName,
        description: payload.data.description ?? "",
        durationMinutes: payload.data.durationMinutes,
        isPublished: payload.data.isPublished,
        createdById: admin.id,
        questions: {
          create: questionIds.map((questionId, index) => ({
            questionId,
            questionOrder: index,
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    return NextResponse.json(
      {
        id: mockTest.id,
        title: mockTest.title,
        examName: mockTest.examName,
        durationMinutes: mockTest.durationMinutes,
        isPublished: mockTest.isPublished,
        questionCount: mockTest.questions.length,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
}
