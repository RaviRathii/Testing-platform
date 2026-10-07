"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";

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

// Matches the pass mark used on the results page.
const PASS_MARK = 60;

const formatDate = (value: string, options: Intl.DateTimeFormatOptions) =>
  new Date(value).toLocaleString("en-IN", options);

const scoreTone = (score: number) =>
  score >= PASS_MARK
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : score >= 40
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : "bg-rose-50 text-rose-700 ring-rose-200";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAllAttempts, setShowAllAttempts] = useState(false);

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
    if (plan === "FREE" && !window.confirm("Cancel your subscription? You will lose access to mock tests.")) {
      return;
    }

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
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to update subscription.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const metrics = useMemo(() => {
    if (attempts.length === 0) {
      return { totalAttempts: 0, averageScore: 0, bestScore: 0, latestScore: 0, passed: 0 };
    }

    const totalAttempts = attempts.length;
    const averageScore = Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalAttempts);
    const bestScore = Math.max(...attempts.map((attempt) => attempt.score));
    const latestScore = attempts[0].score;
    const passed = attempts.filter((attempt) => attempt.score >= PASS_MARK).length;

    return { totalAttempts, averageScore, bestScore, latestScore, passed };
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
      <main className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8" aria-busy="true">
          <div className="h-28 animate-pulse rounded-3xl bg-surface" />
          <div className="grid gap-4 sm:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-2xl bg-surface" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-3xl bg-surface" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto mt-16 max-w-md rounded-3xl border border-slate-200 bg-surface p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">Log in to see your profile</p>
          <p className="mt-2 text-sm text-slate-600">Your results, progress, and subscription live here.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/login" className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              Log in
            </Link>
            <Link href="/signup" className="rounded-full border border-slate-300 bg-surface px-5 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400">
              Sign up
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const plan = subscription?.plan ?? "FREE";
  const status = subscription?.status ?? "ACTIVE";
  const isPaid = plan !== "FREE" && status === "ACTIVE";
  const graphData = attempts.slice(0, 10).reverse();
  const visibleAttempts = showAllAttempts ? attempts : attempts.slice(0, 5);

  const stats = [
    { label: "Tests taken", value: String(metrics.totalAttempts), hint: `${metrics.passed} passed` },
    { label: "Average score", value: `${metrics.averageScore}%`, hint: `Pass mark ${PASS_MARK}%` },
    { label: "Best score", value: `${metrics.bestScore}%`, hint: "All-time high" },
    {
      label: "Latest score",
      value: `${metrics.latestScore}%`,
      hint:
        attempts.length > 1
          ? `${attempts[0].score - attempts[1].score >= 0 ? "+" : ""}${attempts[0].score - attempts[1].score} vs previous`
          : "Most recent attempt",
    },
  ];

  return (
    <main className="min-h-screen text-slate-900">
      <SiteHeader />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        {/* Identity */}
        <section className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-surface p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold">{user.name}</h1>
              <p className="truncate text-sm text-slate-500">{user.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {user.isAdmin ? "Admin" : "Student"}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {isPaid ? `${plan.charAt(0)}${plan.slice(1).toLowerCase()} plan` : "Free plan"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.isAdmin && (
              <Link href="/admin" className="rounded-full border border-slate-300 bg-surface px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400">
                Admin panel
              </Link>
            )}
            <Link href="/tests" className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              Take a mock test
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">{stat.value}</p>
              <p className="mt-1 text-xs text-slate-500">{stat.hint}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            {/* Trend */}
            <section className="rounded-3xl border border-slate-200 bg-surface p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Score trend</h2>
                <span className="text-xs text-slate-500">Last {graphData.length || 10} attempts</span>
              </div>

              {graphData.length === 0 ? (
                <p className="mt-6 text-sm text-slate-500">Your scores will appear here after your first test.</p>
              ) : (
                <div className="mt-6">
                  <div className="relative h-48">
                    {[100, 50, 0].map((line) => (
                      <div key={line} className="absolute inset-x-0 flex items-center gap-2" style={{ bottom: `${line}%` }}>
                        <span className="w-8 -translate-y-1/2 text-right text-[10px] text-slate-400">{line}%</span>
                        <span className="h-px flex-1 -translate-y-1/2 bg-slate-100" />
                      </div>
                    ))}
                    <div className="absolute inset-x-0 flex items-center gap-2" style={{ bottom: `${PASS_MARK}%` }}>
                      <span className="w-8" />
                      <span className="h-px flex-1 -translate-y-1/2 border-t border-dashed border-emerald-400" />
                      <span className="-translate-y-1/2 text-[10px] font-semibold text-emerald-600">Pass</span>
                    </div>
                    <div className="absolute inset-y-0 left-10 right-8 flex items-end gap-2 sm:gap-3">
                      {graphData.map((attempt) => (
                        <Link
                          key={attempt.id}
                          href={`/results/${attempt.id}`}
                          className="group relative flex h-full max-w-14 flex-1 items-end"
                          aria-label={`${attempt.title}: ${attempt.score}%`}
                        >
                          <span
                            className={`w-full rounded-t-md ${
                              attempt.score >= PASS_MARK ? "bg-emerald-500" : "bg-indigo-500"
                            } group-hover:opacity-80`}
                            style={{ height: `${Math.max(2, attempt.score)}%` }}
                          />
                          <span className="pointer-events-none absolute -top-1 left-1/2 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] text-white group-hover:block">
                            {attempt.score}% · {formatDate(attempt.submittedAt, { day: "2-digit", month: "short" })}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="ml-10 mr-8 mt-2 flex gap-2 sm:gap-3">
                    {graphData.map((attempt) => (
                      <span key={attempt.id} className="max-w-14 flex-1 truncate text-center text-[10px] text-slate-400">
                        {formatDate(attempt.submittedAt, { day: "2-digit", month: "short" })}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Attempts */}
            <section className="rounded-3xl border border-slate-200 bg-surface p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent attempts</h2>
                {attempts.length > 0 && <span className="text-xs text-slate-500">{attempts.length} total</span>}
              </div>

              {attempts.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                  <p className="font-semibold text-slate-900">No attempts yet</p>
                  <p className="mt-1 text-sm text-slate-600">Take your first mock test to start tracking your progress.</p>
                  <Link href="/tests" className="mt-4 inline-block rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                    Browse mock tests
                  </Link>
                </div>
              ) : (
                <>
                  <ul className="mt-4 divide-y divide-slate-100">
                    {visibleAttempts.map((attempt) => (
                      <li key={attempt.id}>
                        <Link
                          href={`/results/${attempt.id}`}
                          className="-mx-3 flex items-center gap-4 rounded-xl px-3 py-3 hover:bg-slate-50"
                        >
                          <span className={`flex h-12 w-14 shrink-0 items-center justify-center rounded-xl text-sm font-bold ring-1 ${scoreTone(attempt.score)}`}>
                            {attempt.score}%
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-slate-900">{attempt.title}</span>
                            <span className="block truncate text-xs text-slate-500">
                              {attempt.examName} · {attempt.correctAnswers}/{attempt.totalQuestions} correct
                            </span>
                          </span>
                          <span className="hidden shrink-0 text-right text-xs text-slate-500 sm:block">
                            {formatDate(attempt.submittedAt, { dateStyle: "medium" })}
                            <br />
                            {formatDate(attempt.submittedAt, { timeStyle: "short" })}
                          </span>
                          <span className="shrink-0 text-slate-400" aria-hidden>
                            →
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {attempts.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setShowAllAttempts((current) => !current)}
                      className="mt-3 text-sm font-semibold text-indigo-700 hover:text-indigo-500"
                    >
                      {showAllAttempts ? "Show fewer" : `Show all ${attempts.length} attempts`}
                    </button>
                  )}
                </>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            {/* Subscription */}
            <section className="rounded-3xl border border-slate-200 bg-surface p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Subscription</h2>

              {user.isAdmin ? (
                <p className="mt-3 text-sm text-slate-600">Admin accounts have full access to every test.</p>
              ) : isPaid ? (
                <>
                  <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
                    <p className="text-sm font-semibold text-emerald-800">{plan.charAt(0) + plan.slice(1).toLowerCase()} plan · Active</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-900">
                      ₹49<span className="text-sm font-medium text-emerald-700">/month</span>
                    </p>
                    {subscription?.expiresAt && (
                      <p className="mt-1 text-xs text-emerald-700">
                        Renews {formatDate(subscription.expiresAt, { dateStyle: "medium" })}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSubscriptionChange("FREE")}
                    className="mt-4 text-sm font-medium text-slate-500 underline-offset-2 hover:text-rose-600 hover:underline disabled:opacity-60"
                  >
                    {saving ? "Updating..." : "Cancel subscription"}
                  </button>
                </>
              ) : (
                <>
                  <p className="mt-3 text-sm text-slate-600">Unlock every mock test and full solutions.</p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-700">
                    {["Unlimited mock tests", "Detailed solutions", "Section-wise analysis"].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="text-emerald-600" aria-hidden>✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSubscriptionChange("BASIC")}
                    className="mt-5 w-full rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Updating..." : "Upgrade for ₹49/month"}
                  </button>
                </>
              )}
            </section>

            {/* Exam breakdown */}
            <section className="rounded-3xl border border-slate-200 bg-surface p-6 shadow-sm">
              <h2 className="text-lg font-semibold">By exam</h2>
              {examBreakdown.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No exam history yet.</p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {examBreakdown.map((exam) => (
                    <li key={exam.examName}>
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="truncate font-medium text-slate-800">{exam.examName}</span>
                        <span className="shrink-0 font-semibold text-slate-900">{exam.averageScore}%</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${exam.averageScore >= PASS_MARK ? "bg-emerald-500" : "bg-indigo-500"}`}
                          style={{ width: `${exam.averageScore}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Best {exam.bestScore}% · {exam.totalAttempts} attempt{exam.totalAttempts === 1 ? "" : "s"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <button
              type="button"
              onClick={() => void handleLogout()}
              className="w-full rounded-full border border-slate-300 bg-surface px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-400"
            >
              Log out
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}
