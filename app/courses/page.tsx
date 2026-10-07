import type { Metadata } from "next";
import { CourseCard } from "@/components/course-card";
import { SiteHeader } from "@/components/site-header";
import { categoryBlurbs, courseCategories, courses, coursesByCategory } from "@/lib/courses";

export const metadata: Metadata = {
  title: "Courses · Mock Test Platform",
  description: "Subject-wise courses for SSC, Banking, Railway, UPSC, State Government, and Engineering.",
};

const anchor = (category: string) => category.toLowerCase().replace(/\s+/g, "-");

export default function CoursesPage() {
  return (
    <main className="min-h-screen text-slate-900">
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">Courses</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Pick your exam, study by subject</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          {courses.length} courses with the full subject syllabus, topic lists, practice questions, and matching mock tests.
        </p>

        <nav
          aria-label="Course categories"
          className="sticky top-[57px] z-20 -mx-4 mt-8 flex gap-2 overflow-x-auto border-b border-slate-200 bg-slate-50/90 px-4 py-3 backdrop-blur sm:top-[61px] sm:mx-0 sm:rounded-2xl sm:border sm:px-3"
        >
          {courseCategories.map((category) => (
            <a
              key={category}
              href={`#${anchor(category)}`}
              className="whitespace-nowrap rounded-full border border-slate-200 bg-surface px-3.5 py-1.5 text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
            >
              {category}
              <span className="ml-1.5 text-xs font-medium text-slate-400">{coursesByCategory(category).length}</span>
            </a>
          ))}
        </nav>

        <div className="mt-6 space-y-14">
          {courseCategories.map((category) => (
            <section key={category} id={anchor(category)} className="scroll-mt-36">
              <h2 className="text-2xl font-bold tracking-tight">{category}</h2>
              <p className="mt-1 text-sm text-slate-600">{categoryBlurbs[category]}</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {coursesByCategory(category).map((course) => (
                  <CourseCard key={course.slug} course={course} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
