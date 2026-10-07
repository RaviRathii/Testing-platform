import Link from "next/link";
import { QuestionPractice } from "@/components/question-practice";
import { SiteHeader } from "@/components/site-header";
import { getCourse } from "@/lib/courses";

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; subject?: string }>;
}) {
  const params = await searchParams;
  const course = params.course ? getCourse(params.course) : undefined;
  const subject = course?.subjects.find((item) => item.id === params.subject);

  return (
    <main className="min-h-screen text-slate-900">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          {course && subject ? (
            <>
              <Link href={`/courses/${course.slug}`} className="text-sm font-medium text-indigo-700 hover:text-indigo-500">
                ← {course.name} course
              </Link>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{subject.name}</h1>
              <p className="mt-2 text-slate-600">Practise {subject.name.toLowerCase()} questions against the clock.</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">Practice</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Question bank practice</h1>
              <p className="mt-2 text-slate-600">
                Work through the full question bank against the clock, or{" "}
                <Link href="/courses" className="font-medium text-indigo-700 hover:text-indigo-500">
                  pick a course
                </Link>{" "}
                to practise one subject.
              </p>
            </>
          )}
        </div>

        <QuestionPractice
          key={subject ? `${course?.slug}:${subject.id}` : "all"}
          title={subject ? `${subject.name} · ${course?.name}` : undefined}
          filter={subject ? { pattern: subject.questionMatch.source, flags: subject.questionMatch.flags } : undefined}
        />
      </div>
    </main>
  );
}
