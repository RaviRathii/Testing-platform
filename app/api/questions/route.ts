import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const questionSchema = z.object({
  category: z.string().min(2),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  questionText: z.string().min(10),
  options: z.array(z.string()).length(4),
  correctOption: z.number().int().min(0).max(3),
  explanation: z.string().optional(),
  isActive: z.boolean().default(true),
});

const sampleQuestions = [
  {
    category: "Quantitative Aptitude",
    difficulty: "EASY",
    questionText: "If a train travels 180 km in 3 hours, what is its average speed?",
    options: ["40 km/h", "50 km/h", "60 km/h", "70 km/h"],
    correctOption: 2,
    explanation: "Average speed = distance / time = 180 / 3 = 60 km/h.",
  },
  {
    category: "Quantitative Aptitude",
    difficulty: "EASY",
    questionText: "A sum of Rs. 5000 becomes Rs. 6200 after 2 years at simple interest. The rate per annum is:",
    options: ["8%", "10%", "12%", "14%"],
    correctOption: 2,
    explanation: "Simple interest is Rs. 1200 over 2 years; rate = (1200 × 100) / (5000 × 2) = 12%.",
  },
  {
    category: "Quantitative Aptitude",
    difficulty: "MEDIUM",
    questionText: "The ratio of two numbers is 3:5 and their sum is 96. The larger number is:",
    options: ["36", "40", "48", "60"],
    correctOption: 3,
    explanation: "If the numbers are 3x and 5x, then 8x = 96, so x = 12 and the larger number is 60.",
  },
  {
    category: "Quantitative Aptitude",
    difficulty: "MEDIUM",
    questionText: "A can complete a task in 8 days and B can complete it in 12 days. Working together, they will finish the task in:",
    options: ["4.8 days", "5 days", "4 days", "6 days"],
    correctOption: 0,
    explanation: "Combined work rate = 1/8 + 1/12 = 5/24, so time = 24/5 = 4.8 days.",
  },
  {
    category: "Reasoning",
    difficulty: "EASY",
    questionText: "Find the odd one out: 2, 4, 8, 16, 31, 64",
    options: ["2", "8", "31", "64"],
    correctOption: 2,
    explanation: "All other numbers are powers of 2: 2, 4, 8, 16, 64. 31 is the odd one out.",
  },
  {
    category: "Reasoning",
    difficulty: "MEDIUM",
    questionText: "If 'CODE' is written as 'DPEF', how will 'MATH' be written?",
    options: ["NBUI", "NBUJ", "NBVI", "NCUI"],
    correctOption: 0,
    explanation: "Each letter shifts forward by one position in the alphabet: C→D, O→P, D→E, E→F. Applying the same rule to MATH gives NBUI.",
  },
  {
    category: "English Language",
    difficulty: "EASY",
    questionText: "Choose the word nearest in meaning to 'vivid'.",
    options: ["Dull", "Brilliant", "Weak", "Silent"],
    correctOption: 1,
    explanation: "Vivid means bright, clear, and lively; 'brilliant' is the nearest in meaning.",
  },
  {
    category: "English Language",
    difficulty: "MEDIUM",
    questionText: "Select the correct sentence:",
    options: [
      "He do not know the answer.",
      "He does not know the answer.",
      "He not know the answer.",
      "He do knows the answer."
    ],
    correctOption: 1,
    explanation: "With he/she/it, the verb takes 'does' and the base verb 'know' remains unchanged.",
  },
  {
    category: "General Awareness",
    difficulty: "MEDIUM",
    questionText: "Who is known as the 'Father of the Indian Constitution'?",
    options: ["Dr. B.R. Ambedkar", "Mahatma Gandhi", "Jawaharlal Nehru", "Sardar Patel"],
    correctOption: 0,
    explanation: "Dr. B.R. Ambedkar is known as the chief architect of the Indian Constitution.",
  },
  {
    category: "General Awareness",
    difficulty: "MEDIUM",
    questionText: "Which is the largest planet in our solar system?",
    options: ["Earth", "Mars", "Jupiter", "Saturn"],
    correctOption: 2,
    explanation: "Jupiter is the largest planet in the solar system.",
  },
  {
    category: "General Awareness",
    difficulty: "EASY",
    questionText: "The national anthem of India is:",
    options: ["Vande Mataram", "Jana Gana Mana", "Sare Jahan Se Achha", "Kadam Kadam Badhaye Ja"],
    correctOption: 1,
    explanation: "'Jana Gana Mana' is the national anthem of India.",
  },
  {
    category: "Computer Awareness",
    difficulty: "EASY",
    questionText: "Which language is commonly used for styling web pages?",
    options: ["HTML", "SQL", "C++", "Python"],
    correctOption: 0,
    explanation: "HTML is used for content structure, while CSS is used for styling web pages.",
  },
] as const;

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const questionCount = await prisma.question.count();

  if (questionCount === 0) {
    await prisma.question.createMany({
      data: sampleQuestions.map((question) => ({
        ...question,
        isActive: true,
      })),
    });
  }

  const questions = await prisma.question.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    questions.map((question) => ({
      id: question.id,
      category: question.category,
      difficulty: question.difficulty,
      questionText: question.questionText,
      options: Array.isArray(question.options) ? (question.options as string[]) : [],
      explanation: question.explanation,
      createdAt: question.createdAt,
    })),
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await request.json();
  const payload = questionSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Question payload is invalid." }, { status: 400 });
  }

  const question = await prisma.question.create({
    data: {
      category: payload.data.category,
      difficulty: payload.data.difficulty,
      questionText: payload.data.questionText,
      options: payload.data.options,
      correctOption: payload.data.correctOption,
      explanation: payload.data.explanation ?? "",
      isActive: payload.data.isActive,
      createdById: user.id,
    },
  });

  return NextResponse.json(
    {
      id: question.id,
      category: question.category,
      difficulty: question.difficulty,
      questionText: question.questionText,
      options: Array.isArray(question.options) ? (question.options as string[]) : [],
      explanation: question.explanation,
      createdAt: question.createdAt,
    },
    { status: 201 },
  );
}
