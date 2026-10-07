import { QuestionPractice } from "@/components/question-practice";
import { SiteHeader } from "@/components/site-header";

export default function QuestionsPage() {
  return (
    <main className="min-h-screen text-slate-900">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">Practice</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Question bank practice</h1>
          <p className="mt-2 text-slate-600">Work through the full question bank against the clock.</p>
        </div>

        <QuestionPractice />
      </div>
    </main>
  );
}
