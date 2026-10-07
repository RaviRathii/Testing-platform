import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseCard } from "@/components/course-card";
import { SiteHeader } from "@/components/site-header";
import { getCourseStats } from "@/lib/course-stats";
import { countTopics, coursesByCategory, getCourse } from "@/lib/courses";

// Question counts and mock tests come from the database on each request.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = getCourse((await params).slug);
  return course
    ? { title: `${course.name} course · Mock Test Platform`, description: course.description }
    : { title: "Course not found · Mock Test Platform" };
}

export default async function CoursePage({ params }: Props) {
  const course = getCourse((await params).slug);

  if (!course) {
    notFound();
  }

  const { subjectQuestionCounts, tests } = await getCourseStats(course);
  const totalQuestions = Object.values(subjectQuestionCounts).reduce((total, count) => total + count, 0);
  const relatedCourses = coursesByCategory(course.category)
    .filter((item) => item.slug !== course.slug)
    .slice(0, 3);

  return (
    <main className="min-h-screen text-slate-900">
      <SiteHeader />

      {/* Header */}
      <section className="border-b border-slate-200 bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
            <Link href="/courses" className="hover:text-slate-900">
              Courses
            </Link>
            <span className="mx-2">/</span>
            <Link href={`/courses#${course.category.toLowerCase().replace(/\s+/g, "-")}`} className="hover:text-slate-900">
              {course.category}
            </Link>
          </nav>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{course.name}</h1>
          <p className="mt-3 max-w-3xl text-lg text-slate-600">{course.description}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {course.pattern.map((line) => (
              <span key={line} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
                {line}
              </span>
            ))}
          </div>

          <dl className="mt-8 grid max-w-xl grid-cols-3 gap-4">
            {[
              { label: "Subjects", value: course.subjects.length },
              { label: "Topics", value: countTopics(course) },
              { label: "Mock tests", value: tests.length },
            ].map((item) => (
              <div key={item.label}>
                <dt className="text-sm text-slate-500">{item.label}</dt>
                <dd className="text-2xl font-bold">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
        {/* Subjects */}
        <section aria-labelledby="subjects-heading" className="min-w-0">
          <h2 id="subjects-heading" className="text-xl font-bold">
            Subjects &amp; syllabus
          </h2>
          <ol className="mt-5 space-y-4">
            {course.subjects.map((subject, index) => {
              const questionCount = subjectQuestionCounts[subject.id] ?? 0;
              return (
                <li key={subject.id} className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900">{subject.name}</h3>
                        <p className="mt-0.5 text-sm text-slate-600">{subject.summary}</p>
                      </div>
                    </div>
                    {questionCount > 0 ? (
                      <Link
                        href={`/questions?course=${course.slug}&subject=${subject.id}`}
                        className="shrink-0 self-start rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                      >
                        Practise {questionCount} question{questionCount === 1 ? "" : "s"}
                      </Link>
                    ) : (
                      <span className="shrink-0 self-start rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
                        Questions coming soon
                      </span>
                    )}
                  </div>
                  <ul className="mt-4 flex flex-wrap gap-1.5 sm:pl-[52px]">
                    {subject.topics.map((topic) => (
                      <li key={topic} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {topic}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm">
            <h2 className="font-semibold">Mock tests</h2>
            {tests.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">
                No {course.name} mock tests yet.{" "}
                {totalQuestions > 0 ? "Practise by subject in the meantime." : "Check back soon."}
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {tests.map((test) => (
                  <li key={test.id} className="flex items-center justify-between gap-3 py-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-900">{test.title}</span>
                      <span className="block text-xs text-slate-500">
                        {test.questionCount} questions · {test.durationMinutes} min
                      </span>
                    </span>
                    <Link
                      href={`/tests/${test.id}`}
                      className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-hover"
                    >
                      Start
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/tests" className="mt-3 inline-block text-sm font-semibold text-indigo-700 hover:text-indigo-500">
              All mock tests →
            </Link>
          </section>

          {course.category === "Engineering" && (
            <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
              <h2 className="font-semibold text-slate-900">Ready for an interview?</h2>
              <p className="mt-1 text-sm text-slate-600">
                Practise a DSA, system design, or development round with our AI interviewer, or book the expert panel.
              </p>
              <Link href="/interviews" className="mt-3 inline-block text-sm font-semibold text-indigo-700 hover:text-indigo-500">
                Start a mock interview →
              </Link>
            </section>
          )}

          <section className="rounded-2xl bg-ink p-5 text-white">
            <h2 className="font-semibold">How to use this course</h2>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-white/70">
              <li>Work through one subject at a time, topic by topic.</li>
              <li>Practise that subject&apos;s questions and review the solutions.</li>
              <li>Take a full mock test to check your exam readiness.</li>
            </ol>
          </section>
        </aside>
      </div>

      {relatedCourses.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold">More {course.category} courses</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {relatedCourses.map((item) => (
              <CourseCard key={item.slug} course={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
