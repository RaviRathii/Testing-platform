import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const questionSchema = z.object({
  category: z.string().min(2),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  questionText: z.string().min(10),
  options: z.array(z.string()).length(4),
  correctOption: z.number().int().min(0).max(3),
  explanation: z.string().optional(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const questions = await prisma.question.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: true },
  });

  return NextResponse.json(
    questions.map((question) => ({
      id: question.id,
      category: question.category,
      difficulty: question.difficulty,
      questionText: question.questionText,
      options: Array.isArray(question.options) ? (question.options as string[]) : [],
      correctOption: question.correctOption,
      explanation: question.explanation,
      isActive: question.isActive,
      createdBy: question.createdBy?.name ?? "System",
    })),
  );
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await request.json();
  const payload = questionSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Question payload is invalid." }, { status: 400 });
  }

  const admin = await requireAdmin();
  const question = await prisma.question.create({
    data: {
      category: payload.data.category,
      difficulty: payload.data.difficulty,
      questionText: payload.data.questionText,
      options: payload.data.options,
      correctOption: payload.data.correctOption,
      explanation: payload.data.explanation ?? "",
      isActive: payload.data.isActive,
      createdById: admin.id,
    },
  });

  return NextResponse.json({
    id: question.id,
    category: question.category,
    difficulty: question.difficulty,
    questionText: question.questionText,
    options: Array.isArray(question.options) ? (question.options as string[]) : [],
    correctOption: question.correctOption,
    explanation: question.explanation,
    isActive: question.isActive,
  }, { status: 201 });
}
