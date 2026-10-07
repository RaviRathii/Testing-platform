"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type ResultDetail = {
  attempt: {
    id: string;
    title: string;
    examName: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    startedAt: string;
    submittedAt: string;
    durationMinutes?: number | null;
  };
  conclusion: {
    percentage: number;
    correctAnswers: number;
    totalQuestions: number;
    passed: boolean;
  };
  categoryBreakdown: {
    category: string;
    total: number;
    correct: number;
    score: number;
  }[];
  questionReview: {
    id: string;
    questionText: string;
    category: string;
    difficulty: string;
    selectedOption: number | null;
    correctOption: number;
    isCorrect: boolean;
    options: string[];
    explanation?: string | null;
  }[];
  examBreakdown: {
    examName: string;
    averageScore: number;
    bestScore: number;
    totalAttempts: number;
  }[];
};

export default function ResultsDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ResultDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params?.id) {
      return;
    }

    const loadResult = async () => {
      try {
        const response = await fetch(`/api/results/${params.id}`, { cache: "no-store" });
        const payload = (await response.json()) as ResultDetail & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load this result.");
        }

        setData(payload);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load result.");
      } finally {
        setLoading(false);
      }
    };

    void loadResult();
  }, [params?.id]);

  if (loading) {
    return (
      <main className="min-h-screen p-8 text-slate-900">
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-surface p-8">Loading result details...</div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen p-8 text-slate-900">
        <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-slate-300 bg-surface p-8 text-center">
          <p className="text-xl font-semibold">Result unavailable</p>
          <p className="mt-2 text-sm text-slate-600">{error || "This result could not be loaded."}</p>
          <Link href="/profile" className="mt-5 inline-block rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
            Back to profile
          </Link>
        </div>
      </main>
    );
  }

  const optionLabels = ["A", "B", "C", "D"];

  return (
    <main className="min-h-screen px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">Result analysis</p>
            <h1 className="mt-2 text-3xl font-bold">{data.attempt.title}</h1>
          </div>
          <Link href="/profile" className="rounded-full border border-slate-300 bg-surface px-4 py-2 text-sm font-medium text-slate-700">
            Back to profile
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Score</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{data.attempt.score}%</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Correct</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{data.conclusion.correctAnswers}/{data.conclusion.totalQuestions}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Exam</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{data.attempt.examName}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</p>
            <p className={`mt-2 text-xl font-bold ${data.conclusion.passed ? "text-emerald-700" : "text-amber-700"}`}>
              {data.conclusion.passed ? "Passed" : "Needs work"}
            </p>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-surface p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Category-wise analysis</h2>
              <div className="mt-6 space-y-4">
                {data.categoryBreakdown.map((category) => (
                  <div key={category.category}>
                    <div className="mb-2 flex items-center justify-between text-sm text-slate-700">
                      <span className="font-medium">{category.category}</span>
                      <span>{category.correct}/{category.total} correct</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500"
                        style={{ width: `${Math.max(6, category.score)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{category.score}% accuracy</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-surface p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Question review</h2>
              <div className="mt-5 space-y-5">
                {data.questionReview.map((question, index) => (
                  <div key={question.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">{question.category}</p>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${question.isCorrect ? "bg-emerald-100 text-emerald-700" : question.selectedOption === null ? "bg-slate-200 text-slate-600" : "bg-amber-100 text-amber-700"}`}>
                        {question.isCorrect ? "Correct" : question.selectedOption === null ? "Skipped" : "Incorrect"}
                      </span>
                    </div>

                    <p className="mt-3 text-base font-semibold text-slate-900">
                      {index + 1}. {question.questionText}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{question.difficulty}</p>

                    <div className="mt-4 space-y-2">
                      {question.options.map((option, optionIndex) => {
                        const isCorrectChoice = optionIndex === question.correctOption;
                        const isSelectedChoice = optionIndex === question.selectedOption;

                        return (
                          <div
                            key={`${question.id}-${optionIndex}`}
                            className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm ${
                              isCorrectChoice
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : isSelectedChoice
                                  ? "border-amber-200 bg-amber-50 text-amber-900"
                                  : "border-slate-200 bg-surface text-slate-700"
                            }`}
                          >
                            <span className="font-semibold text-slate-600">{optionLabels[optionIndex]}</span>
                            <span>{option}</span>
                            {isCorrectChoice ? <span className="ml-auto text-xs font-semibold">Correct</span> : null}
                            {isSelectedChoice && !isCorrectChoice ? <span className="ml-auto text-xs font-semibold">Your answer</span> : null}
                          </div>
                        );
                      })}
                    </div>

                    {question.explanation ? (
                      <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-800">
                        <p className="font-semibold">Explanation</p>
                        <p className="mt-1">{question.explanation}</p>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-surface p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Exam comparison</h2>
              <div className="mt-6 space-y-5">
                {data.examBreakdown.map((exam) => (
                  <div key={exam.examName}>
                    <div className="mb-2 flex items-center justify-between text-sm text-slate-700">
                      <span className="font-medium">{exam.examName}</span>
                      <span>{exam.averageScore}% avg</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                        style={{ width: `${Math.max(8, exam.averageScore)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Best: {exam.bestScore}% • Attempts: {exam.totalAttempts}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-surface p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Attempt summary</h2>
              <div className="mt-5 space-y-3 text-sm text-slate-700">
                <div className="flex justify-between gap-3">
                  <span>Attempt date</span>
                  <span className="font-medium text-slate-900">
                    {new Date(data.attempt.submittedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Duration</span>
                  <span className="font-medium text-slate-900">{data.attempt.durationMinutes ?? "N/A"} mins</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Accuracy</span>
                  <span className="font-medium text-slate-900">{data.attempt.score}%</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Pass threshold</span>
                  <span className="font-medium text-slate-900">60%</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
