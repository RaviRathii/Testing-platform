"use client";

import Link from "next/link";
import { useState } from "react";
import { CourseCard } from "@/components/course-card";
import { SiteHeader } from "@/components/site-header";
import { categoryBlurbs, courseCategories, courses, coursesByCategory, type CourseCategory } from "@/lib/courses";

const features = [
  {
    title: "Real exam timing",
    description: "Every test runs on its own clock and submits itself when time is up, just like the real exam.",
    icon: "M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  },
  {
    title: "Exam-style interface",
    description: "Question palette, mark for review, and clear response — the controls you'll see on exam day.",
    icon: "M4 5h6v6H4V5Zm10 0h6v6h-6V5ZM4 15h6v6H4v-6Zm10 0h6v6h-6v-6Z",
  },
  {
    title: "Detailed solutions",
    description: "Review every question after you submit, with the correct answer and a worked explanation.",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  },
  {
    title: "Progress analytics",
    description: "Section-wise accuracy and score history show exactly where to focus your next study session.",
    icon: "M4 20V10m6 10V4m6 16v-7m4 7H2",
  },
];

const steps = [
  { title: "Pick a test", description: "Choose a full-length mock or practise from the question bank." },
  { title: "Attempt it under exam conditions", description: "Timed, with a question palette and mark-for-review." },
  { title: "Review and improve", description: "See solutions, section-wise accuracy, and track your trend." },
];

const plusFeatures = [
  "Unlimited mock test attempts",
  "Full question bank practice",
  "Solutions and explanations for every question",
  "Section-wise performance analysis",
];


const sampleOptions = ["40 km/h", "50 km/h", "60 km/h", "70 km/h"];

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
      <path d={path} />
    </svg>
  );
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<CourseCategory>("SSC");

  return (
    <main className="min-h-screen text-slate-900">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-surface px-3 py-1 text-xs font-semibold text-indigo-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              SSC, Banking, Railway, UPSC &amp; Engineering
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Practise like it&apos;s <span className="text-indigo-700">exam day.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Timed mock tests with a real exam interface, instant scoring, and detailed solutions — so you know
              exactly what to work on next.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/tests"
                className="rounded-full bg-indigo-600 px-6 py-3 text-center text-base font-semibold text-white shadow-sm shadow-indigo-600/30 hover:bg-indigo-500"
              >
                Browse mock tests
              </Link>
              <Link
                href="/courses"
                className="rounded-full border border-slate-300 bg-surface px-6 py-3 text-center text-base font-semibold text-slate-700 hover:border-slate-400 hover:text-slate-900"
              >
                Explore courses
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">Full access for ₹49/month. Cancel anytime.</p>
          </div>

          {/* Product preview: a static sample question, not live data. */}
          <div className="relative" aria-label="Preview of the test interface">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-indigo-200/60 via-surface to-violet-200/50 blur-2xl" />
            <div className="rounded-3xl border border-slate-200 bg-surface p-5 shadow-xl shadow-slate-300/40">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sample question</p>
                <span className="rounded-full bg-indigo-100 px-2.5 py-1 font-mono text-xs font-semibold text-indigo-700">
                  42:18
                </span>
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-amber-700">Quantitative Aptitude</p>
              <p className="mt-2 font-semibold text-slate-900">
                A train travels 180 km in 3 hours. What is its average speed?
              </p>
              <div className="mt-4 space-y-2">
                {sampleOptions.map((option, index) => (
                  <div
                    key={option}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm ${
                      index === 2
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span className="font-semibold text-slate-400">{String.fromCharCode(65 + index)}</span>
                    {option}
                    {index === 2 && <span className="ml-auto text-xs font-semibold">Correct</span>}
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-indigo-50 p-3 text-xs leading-5 text-indigo-800">
                <span className="font-semibold">Solution: </span>Average speed = distance ÷ time = 180 ÷ 3 = 60 km/h.
              </div>
              <div className="mt-4 grid grid-cols-8 gap-1.5">
                {Array.from({ length: 16 }, (_, index) => (
                  <span
                    key={index}
                    className={`h-6 rounded-md ${
                      index === 5
                        ? "bg-indigo-600"
                        : [0, 1, 2, 4, 7, 9].includes(index)
                          ? "bg-emerald-200"
                          : index === 3 || index === 10
                            ? "bg-violet-200"
                            : "bg-slate-100"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-slate-200 bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {features.map((feature) => (
            <div key={feature.title}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <Icon path={feature.icon} />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Courses */}
      <section id="courses" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">Courses</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Government exams &amp; engineering</h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Subject-wise syllabus, practice questions, and mock tests for every exam you&apos;re preparing for.
            </p>
          </div>
          <Link href="/courses" className="shrink-0 text-sm font-semibold text-indigo-700 hover:text-indigo-500">
            Browse all {courses.length} courses →
          </Link>
        </div>

        <div className="mt-8 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Course categories">
          {courseCategories.map((category) => (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={activeCategory === category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
                activeCategory === category
                  ? "bg-ink text-white shadow-sm"
                  : "border border-slate-200 bg-surface text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm text-slate-600">{categoryBlurbs[activeCategory]}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3" role="tabpanel">
          {coursesByCategory(activeCategory).map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-ink px-6 py-12 text-white sm:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">How it works</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">Three steps to a better score</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-white/70">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 rounded-3xl border border-slate-200 bg-surface p-8 shadow-sm sm:p-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">Pricing</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">One simple plan</h2>
            <p className="mt-3 text-slate-600">Everything you need to prepare, for less than the cost of a single book.</p>
            <p className="mt-6 flex items-baseline gap-1">
              <span className="text-5xl font-bold tracking-tight text-slate-900">₹49</span>
              <span className="text-slate-500">/month</span>
            </p>
            <Link
              href="/signup"
              className="mt-6 inline-block rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Get started
            </Link>
          </div>
          <ul className="space-y-3">
            {plusFeatures.map((item) => (
              <li key={item} className="flex items-start gap-3 text-slate-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Mock Test Platform</p>
          <p>Coming soon: leaderboards and personalised study plans.</p>
        </div>
      </footer>
    </main>
  );
}
