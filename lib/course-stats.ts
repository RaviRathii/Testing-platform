import type { Course } from "@/lib/courses";
import { prisma } from "@/lib/prisma";

export type CourseTest = {
  id: string;
  title: string;
  examName: string;
  durationMinutes: number;
  questionCount: number;
};

export type CourseStats = {
  /** Active question count per subject id. */
  subjectQuestionCounts: Record<string, number>;
  tests: CourseTest[];
};

export async function getCourseStats(course: Course): Promise<CourseStats> {
  const [categoryCounts, publishedTests] = await Promise.all([
    prisma.question.groupBy({
      by: ["category"],
      where: { isActive: true },
      _count: { _all: true },
    }),
    prisma.mockTest.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { questions: true } } },
    }),
  ]);

  const subjectQuestionCounts = Object.fromEntries(
    course.subjects.map((subject) => [
      subject.id,
      categoryCounts
        .filter((row) => subject.questionMatch.test(row.category))
        .reduce((total, row) => total + row._count._all, 0),
    ]),
  );

  const tests = publishedTests
    .filter((test) => course.testMatch.test(test.examName) || course.testMatch.test(test.title))
    .map((test) => ({
      id: test.id,
      title: test.title,
      examName: test.examName,
      durationMinutes: test.durationMinutes,
      questionCount: test._count.questions,
    }));

  return { subjectQuestionCounts, tests };
}
