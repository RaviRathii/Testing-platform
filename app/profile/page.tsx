"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
};

type SubscriptionInfo = {
  plan?: string;
  status?: string;
  startsAt?: string;
  expiresAt?: string;
};

type AttemptSummary = {
  id: string;
  title: string;
  examName: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  submittedAt: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadPageProfile = async () => {
      try {
        const [meResponse, attemptsResponse] = await Promise.all([
          fetch("/api/auth/me", { cache: "no-store" }),
          fetch("/api/attempts", { cache: "no-store" }),
        ]);

        if (!isMounted) {
          return;
        }

        if (!meResponse.ok) {
          setUser(null);
          setSubscription(null);
          setAttempts([]);
          setLoading(false);
          return;
        }

        const meData = (await meResponse.json()) as {
          user?: UserProfile;
          subscription?: SubscriptionInfo;
        };

        setUser(meData.user ?? null);
        setSubscription(meData.subscription ?? null);

        if (attemptsResponse.ok) {
          const attemptsData = (await attemptsResponse.json()) as {
            attempts?: AttemptSummary[];
          };
          setAttempts(attemptsData.attempts ?? []);
        } else {
          setAttempts([]);
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setSubscription(null);
          setAttempts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadPageProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubscriptionChange = async (plan: "FREE" | "BASIC") => {
    setSaving(true);

    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          status: plan === "FREE" ? "INACTIVE" : "ACTIVE",
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to update subscription");
      }

      const data = (await response.json()) as { subscription?: SubscriptionInfo };
      setSubscription(data.subscription ?? null);

      const meResponse = await fetch("/api/auth/me", { cache: "no-store" });
      if (meResponse.ok) {
        const meData = (await meResponse.json()) as {
          subscription?: SubscriptionInfo;
        };
        setSubscription(meData.subscription ?? null);
      }
    } finally {
      setSaving(false);
    }
  };

  const metrics = useMemo(() => {
    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        bestScore: 0,
        latestScore: 0,
      };
    }

    const totalAttempts = attempts.length;
    const averageScore = Math.round(
      attempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalAttempts,
    );
    const bestScore = Math.max(...attempts.map((attempt) => attempt.score));
    const latestScore = attempts[0].score;

    return { totalAttempts, averageScore, bestScore, latestScore };
  }, [attempts]);

  const examBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; scoreSum: number; best: number }>();

    attempts.forEach((attempt) => {
      const examName = attempt.examName || "General Practice";
      const entry = map.get(examName) ?? { total: 0, scoreSum: 0, best: 0 };
      entry.total += 1;
      entry.scoreSum += attempt.score;
      entry.best = Math.max(entry.best, attempt.score);
      map.set(examName, entry);
    });

    return Array.from(map.entries()).map(([examName, entry]) => ({
      examName,
      averageScore: Math.round(entry.scoreSum / entry.total),
      bestScore: entry.best,
      totalAttempts: entry.total,
    }));
  }, [attempts]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-8 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8">Loading profile...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-100 p-8 text-slate-900">
        <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-lg font-semibold">Login required</p>
          <p className="mt-2 text-sm text-slate-600">Sign in to view and manage your profile.</p>
          <div className="mt-5 flex justify-center gap-3">
            <a href="/login" className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
              Login
            </a>
            <a href="/signup" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
              Sign up
            </a>
          </div>
        </div>
      </main>
    );
  }

  const graphData = attempts.slice(0, 6).reverse();
  const planLabel = subscription?.plan ?? "FREE";
  const statusLabel = subscription?.status ?? "ACTIVE";
  const accountType = user.isAdmin ? "Admin" : "Student";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Profile</p>
            <h1 className="mt-2 text-3xl font-bold">My account</h1>
          </div>
          <a href="/questions" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">
            Practice tests
          </a>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-2xl font-bold">{user.name}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Account type</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{accountType}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Plan</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{planLabel}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{statusLabel}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Access</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {user.isAdmin ? "Admin panel" : "Practice access"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">Past results</h2>
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">
                  {metrics.totalAttempts} attempts
                </span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Average</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{metrics.averageScore}%</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Best</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{metrics.bestScore}%</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Latest</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{metrics.latestScore}%</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Accuracy</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {metrics.totalAttempts === 0 ? "0%" : `${Math.min(100, metrics.averageScore)}%`}
                  </p>
                </div>
              </div>

              <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">Performance trend</p>
                  <span className="text-xs text-slate-500">Last 6 attempts</span>
                </div>

                {graphData.length === 0 ? (
                  <p className="text-sm text-slate-500">No test attempts yet. Complete your first mock test to see progress trends.</p>
                ) : (
                  <div className="flex h-44 items-end gap-3">
                    {graphData.map((attempt) => (
                      <div key={attempt.id} className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex h-32 w-full items-end justify-center rounded-t-2xl bg-white p-1 shadow-inner">
                          <div
                            className="w-full rounded-t-xl bg-gradient-to-t from-indigo-600 to-blue-400"
                            style={{ height: `${Math.max(12, attempt.score)}%` }}
                            title={`${attempt.score}%`}
                            aria-label={`${attempt.title} scored ${attempt.score}%`}
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{attempt.score}%</p>
                          <p className="text-[10px] text-slate-400">{new Date(attempt.submittedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">Exam comparison</p>
                  <span className="text-xs text-slate-500">By exam</span>
                </div>

                {examBreakdown.length === 0 ? (
                  <p className="text-sm text-slate-500">No exam history yet.</p>
                ) : (
                  <div className="space-y-4">
                    {examBreakdown.map((exam) => (
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
                        <p className="mt-1 text-[11px] text-slate-500">Best: {exam.bestScore}% • Attempts: {exam.totalAttempts}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-7 space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">Recent attempts</p>

                {attempts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                    You have not attempted any mock tests yet. Start with the practice hub to build your performance history.
                  </div>
                ) : (
                  attempts.map((attempt) => (
                    <div key={attempt.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{attempt.title}</p>
                          <p className="text-xs text-slate-500">{attempt.examName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
                            {attempt.score}%
                          </div>
                          <Link href={`/results/${attempt.id}`} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                            View details
                          </Link>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                        <span>{attempt.correctAnswers}/{attempt.totalQuestions} correct</span>
                        <span>{new Date(attempt.submittedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Subscription</h2>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Current plan</p>
                <p className="mt-2 text-2xl font-bold">₹49 / month</p>
                <p className="mt-1 text-sm text-amber-800">
                  {planLabel === "FREE" ? "Your current access is free." : "Your paid plan is active."}
                </p>
              </div>

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  disabled={saving || planLabel !== "FREE"}
                  onClick={() => void handleSubscriptionChange("BASIC")}
                  className="w-full rounded-full bg-amber-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Updating..." : "Upgrade to ₹49 plan"}
                </button>

                <button
                  type="button"
                  disabled={saving || planLabel === "FREE"}
                  onClick={() => void handleSubscriptionChange("FREE")}
                  className="w-full rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Updating..." : "Unsubscribe"}
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Session</h2>
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  router.push("/login");
                }}
                className="mt-4 w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              >
                Logout
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
