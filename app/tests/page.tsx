"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { buildApiUrl } from "@/lib/api";

type MockTestSummary = {
  id: string;
  title: string;
  examName: string;
  description?: string | null;
  durationMinutes: number;
  questionCount: number;
  attemptCount: number;
  bestScore: number | null;
};

export default function MockTestsPage() {
  const [tests, setTests] = useState<MockTestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState("");
  const [examFilter, setExamFilter] = useState("All");

  useEffect(() => {
    const loadTests = async () => {
      try {
        const response = await fetch(buildApiUrl("/mock-tests"), { cache: "no-store" });

        if (response.status === 401) {
          setNeedsLogin(true);
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load mock tests.");
        }

        setTests((await response.json()) as MockTestSummary[]);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load mock tests.");
      } finally {
        setLoading(false);
      }
    };

    void loadTests();
  }, []);

  const examNames = useMemo(() => ["All", ...new Set(tests.map((test) => test.examName))], [tests]);
  const visibleTests = examFilter === "All" ? tests : tests.filter((test) => test.examName === examFilter);

  return (
    <main className="min-h-screen text-slate-900">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">Mock tests</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Choose a test</h1>
          <p className="mt-2 text-slate-600">Full-length, timed tests. Your progress is saved if you leave mid-test.</p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-surface p-6">Loading mock tests...</div>
        ) : needsLogin ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-700">
            <p className="text-lg font-semibold text-slate-900">Login required</p>
            <p className="mt-2">Sign in to see the available mock tests.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href="/login" className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
                Go to login
              </a>
              <a
                href="/signup"
                className="rounded-full border border-slate-300 bg-surface px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Create account
              </a>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">{error}</div>
        ) : tests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-700">
            No mock tests are published yet. Admins can create and publish tests from the admin panel.
          </div>
        ) : (
          <>
            {examNames.length > 2 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {examNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setExamFilter(name)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                      examFilter === name
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-300 bg-surface text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {visibleTests.map((test) => (
                <div key={test.id} className="flex flex-col rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">{test.examName}</p>
                  <h2 className="mt-2 text-lg font-bold text-slate-900">{test.title}</h2>
                  {test.description && <p className="mt-2 text-sm text-slate-600">{test.description}</p>}

                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">{test.questionCount} questions</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">{test.durationMinutes} min</span>
                    {test.bestScore !== null && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                        Best: {test.bestScore}% · {test.attemptCount} attempt{test.attemptCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/tests/${test.id}`}
                    className="mt-5 self-start rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-hover"
                  >
                    {test.attemptCount > 0 ? "Retake test" : "Start test"}
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
