import Link from "next/link";
import { QuestionPractice } from "@/components/question-practice";

export default function QuestionsPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">Practice</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                SSC CGL Tier 1 Mock Exam
            </h1>
          </div>
          <Link
            href="/"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            Back to home
          </Link>
        </div>

        <QuestionPractice />
      </div>
    </main>
  );
}
