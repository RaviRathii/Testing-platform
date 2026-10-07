import Link from "next/link";
import { countTopics, type Course } from "@/lib/courses";

const MAX_SUBJECT_CHIPS = 4;

export function CourseCard({ course }: { course: Course }) {
  const extraSubjects = course.subjects.length - MAX_SUBJECT_CHIPS;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm hover:border-indigo-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">{course.name}</h3>
        <span className="mt-1 shrink-0 text-indigo-500 transition group-hover:translate-x-0.5" aria-hidden>
          →
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{course.description}</p>

      <p className="mt-4 text-xs font-medium text-slate-500">
        {course.subjects.length} subjects · {countTopics(course)} topics · {course.pattern[0]}
      </p>

      <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
        {course.subjects.slice(0, MAX_SUBJECT_CHIPS).map((subject) => (
          <span key={subject.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {subject.name}
          </span>
        ))}
        {extraSubjects > 0 && (
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">+{extraSubjects} more</span>
        )}
      </div>
    </Link>
  );
}
