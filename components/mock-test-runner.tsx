"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { buildApiUrl } from "@/lib/api";

type Question = {
  id: string;
  category: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  questionText: string;
  options: string[];
};

type MockTest = {
  id: string;
  title: string;
  examName: string;
  description?: string | null;
  durationMinutes: number;
  questions: Question[];
};

type AuthUser = {
  id: string;
  isAdmin: boolean;
};

type SubscriptionStatus = {
  plan?: string;
  status?: string;
};

type SavedProgress = {
  deadline: number;
  answers: Record<string, number>;
  marked: string[];
};

type Phase = "loading" | "login" | "locked" | "error" | "intro" | "running";

const storageKey = (testId: string) => `mocktest-progress:${testId}`;

function readProgress(testId: string): SavedProgress | null {
  try {
    const raw = window.localStorage.getItem(storageKey(testId));
    return raw ? (JSON.parse(raw) as SavedProgress) : null;
  } catch {
    return null;
  }
}

function writeProgress(testId: string, progress: SavedProgress) {
  try {
    window.localStorage.setItem(storageKey(testId), JSON.stringify(progress));
  } catch {
    // Progress just won't survive a refresh.
  }
}

function clearProgress(testId: string) {
  try {
    window.localStorage.removeItem(storageKey(testId));
  } catch {
    // Nothing to clean up.
  }
}

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

export function MockTestRunner({ testId }: { testId: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [test, setTest] = useState<MockTest | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        const meResponse = await fetch(buildApiUrl("/auth/me"), { cache: "no-store" });

        if (!meResponse.ok) {
          setPhase("login");
          return;
        }

        const { user } = (await meResponse.json()) as { user?: AuthUser };

        if (!user) {
          setPhase("login");
          return;
        }

        const [testResponse, subscriptionResponse] = await Promise.all([
          fetch(buildApiUrl(`/mock-tests/${testId}`), { cache: "no-store" }),
          fetch(buildApiUrl("/subscriptions"), { cache: "no-store" }),
        ]);

        const testData = (await testResponse.json()) as MockTest & { error?: string };

        if (!testResponse.ok) {
          throw new Error(testData.error ?? "Unable to load this mock test.");
        }

        const { subscription } = (await subscriptionResponse.json()) as { subscription?: SubscriptionStatus };
        const hasAccess =
          user.isAdmin || (!!subscription?.plan && subscription.plan !== "FREE" && subscription.status === "ACTIVE");

        setTest(testData);

        if (!hasAccess) {
          setPhase("locked");
          return;
        }

        const saved = readProgress(testId);

        if (saved) {
          setAnswers(saved.answers);
          setMarked(new Set(saved.marked));
          setVisited(new Set([...Object.keys(saved.answers), ...saved.marked]));
          setDeadline(saved.deadline);
          setTimeLeft(saved.deadline - Date.now());
          setPhase("running");
        } else {
          setPhase("intro");
        }
      } catch (loadError) {
        setErrorMessage(loadError instanceof Error ? loadError.message : "Unable to load this mock test.");
        setPhase("error");
      }
    };

    void load();
  }, [testId]);

  useEffect(() => {
    if (phase === "running" && deadline !== null) {
      writeProgress(testId, { deadline, answers, marked: [...marked] });
    }
  }, [answers, deadline, marked, phase, testId]);

  const submit = useCallback(async () => {
    if (!test || submittedRef.current) {
      return;
    }

    submittedRef.current = true;
    setIsSubmitting(true);
    setConfirmOpen(false);

    try {
      const response = await fetch(buildApiUrl("/attempts"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mockTestId: test.id,
          answers: Object.entries(answers).map(([questionId, selectedOption]) => ({ questionId, selectedOption })),
        }),
      });

      const data = (await response.json()) as { attemptId?: string; error?: string };

      if (!response.ok || !data.attemptId) {
        throw new Error(data.error ?? "Unable to submit the mock test.");
      }

      clearProgress(test.id);
      router.replace(`/results/${data.attemptId}`);
    } catch (submitError) {
      // Leave the saved progress in place so the student can retry.
      submittedRef.current = false;
      setIsSubmitting(false);
      window.alert(submitError instanceof Error ? submitError.message : "Unable to submit the mock test.");
    }
  }, [answers, router, test]);

  // Keep the timer pointing at the latest submit without restarting the interval on every answer.
  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

  useEffect(() => {
    if (phase !== "running" || deadline === null) {
      return;
    }

    const tick = () => {
      const remaining = deadline - Date.now();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        void submitRef.current();
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [deadline, phase]);

  const startTest = () => {
    if (!test) {
      return;
    }

    const newDeadline = Date.now() + test.durationMinutes * 60 * 1000;
    setDeadline(newDeadline);
    setTimeLeft(newDeadline - Date.now());
    setVisited(new Set(test.questions[0] ? [test.questions[0].id] : []));
    setPhase("running");
  };

  const goTo = (index: number) => {
    if (!test) {
      return;
    }

    const bounded = Math.max(0, Math.min(test.questions.length - 1, index));
    setCurrentIndex(bounded);
    setVisited((current) => new Set(current).add(test.questions[bounded].id));
  };

  const handleUpgrade = async () => {
    setUpgradeLoading(true);

    try {
      const response = await fetch(buildApiUrl("/subscriptions"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "BASIC", status: "ACTIVE", amount: 49 }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to activate subscription.");
      }

      setPhase("intro");
    } catch (upgradeError) {
      window.alert(upgradeError instanceof Error ? upgradeError.message : "Unable to activate subscription.");
    } finally {
      setUpgradeLoading(false);
    }
  };

  if (phase === "loading") {
    return <div className="rounded-2xl border border-slate-200 bg-surface p-6">Loading mock test...</div>;
  }

  if (phase === "login") {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-700">
        <p className="text-lg font-semibold text-slate-900">Login required</p>
        <p className="mt-2">Sign in to attempt this mock test.</p>
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
    );
  }

  if (phase === "error" || !test) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
        <p>{errorMessage || "Unable to load this mock test."}</p>
        <Link href="/tests" className="mt-4 inline-block text-sm font-semibold underline">
          Back to all tests
        </Link>
      </div>
    );
  }

  if (phase === "locked") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <p className="text-lg font-semibold">Subscription required</p>
        <p className="mt-2 text-sm">Unlock {test.title} and every other mock test for ₹49/month.</p>
        <button
          type="button"
          onClick={() => void handleUpgrade()}
          disabled={upgradeLoading}
          className="mt-4 rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-65"
        >
          {upgradeLoading ? "Activating..." : "Subscribe for ₹49"}
        </button>
      </div>
    );
  }

  if (test.questions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-700">
        This mock test has no questions yet.
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">{test.examName}</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">{test.title}</h2>
        {test.description && <p className="mt-2 text-slate-600">{test.description}</p>}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Questions</p>
            <p className="mt-1 text-2xl font-bold">{test.questions.length}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Duration</p>
            <p className="mt-1 text-2xl font-bold">{test.durationMinutes} min</p>
          </div>
        </div>

        <ul className="mt-5 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
          <li>The timer starts when you press Start and keeps running if you leave or refresh the page.</li>
          <li>The test is submitted automatically when time runs out.</li>
          <li>Unanswered questions are scored as incorrect.</li>
          <li>Use &ldquo;Mark for review&rdquo; to flag questions you want to revisit.</li>
        </ul>

        <button
          type="button"
          onClick={startTest}
          className="mt-6 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Start test
        </button>
      </div>
    );
  }

  const question = test.questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = test.questions.length - answeredCount;
  const isLowTime = timeLeft <= 5 * 60 * 1000;

  const paletteClass = (item: Question, index: number) => {
    if (index === currentIndex) return "border-indigo-500 bg-indigo-600 text-white";
    const isAnswered = answers[item.id] !== undefined;
    if (marked.has(item.id)) {
      return isAnswered
        ? "border-violet-300 bg-violet-100 text-violet-800 ring-2 ring-emerald-400"
        : "border-violet-300 bg-violet-100 text-violet-800";
    }
    if (isAnswered) return "border-emerald-200 bg-emerald-50 text-emerald-700";
    if (visited.has(item.id)) return "border-rose-200 bg-rose-50 text-rose-700";
    return "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300";
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{test.examName}</p>
            <h2 className="truncate text-lg font-bold text-slate-900">{test.title}</h2>
          </div>
          <div
            role="timer"
            aria-live={isLowTime ? "polite" : "off"}
            className={`shrink-0 rounded-full px-3 py-1.5 font-mono text-sm font-semibold ${
              isLowTime ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-700"
            }`}
          >
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">
              Question {currentIndex + 1} / {test.questions.length}
            </p>
            <div className="flex gap-2">
              <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">
                {question.category}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                {question.difficulty}
              </span>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-slate-900">{question.questionText}</h3>

          <div className="mt-5 space-y-3">
            {question.options.map((option, optionIndex) => (
              <label
                key={`${question.id}-${optionIndex}`}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                  answers[question.id] === optionIndex
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  checked={answers[question.id] === optionIndex}
                  onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                  disabled={isSubmitting}
                  className="mt-1"
                />
                <span className="text-slate-700">
                  <span className="mr-2 font-semibold text-slate-500">{String.fromCharCode(65 + optionIndex)}.</span>
                  {option}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => goTo(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="rounded-full border border-slate-300 bg-surface px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() =>
                  setAnswers((current) => {
                    const next = { ...current };
                    delete next[question.id];
                    return next;
                  })
                }
                disabled={answers[question.id] === undefined}
                className="rounded-full border border-slate-300 bg-surface px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear response
              </button>
              <button
                type="button"
                onClick={() => {
                  setMarked((current) => {
                    const next = new Set(current);
                    if (next.has(question.id)) {
                      next.delete(question.id);
                    } else {
                      next.add(question.id);
                    }
                    return next;
                  });
                  goTo(currentIndex + 1);
                }}
                className="rounded-full border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700"
              >
                {marked.has(question.id) ? "Unmark" : "Mark for review"} &amp; next
              </button>
            </div>
            <button
              type="button"
              onClick={() => goTo(currentIndex + 1)}
              disabled={currentIndex === test.questions.length - 1}
              className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save &amp; next
            </button>
          </div>
        </div>
      </div>

      <aside className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm lg:sticky lg:top-4">
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-emerald-200 bg-emerald-50" /> Answered ({answeredCount})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-rose-200 bg-rose-50" /> Skipped
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-violet-300 bg-violet-100" /> Marked ({marked.size})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-slate-200 bg-slate-50" /> Not visited
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {test.questions.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Question ${index + 1}`}
              aria-current={index === currentIndex ? "step" : undefined}
              className={`rounded-lg border py-2 text-xs font-semibold transition ${paletteClass(item, index)}`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={isSubmitting}
          className="w-full rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-65"
        >
          {isSubmitting ? "Submitting..." : "Submit test"}
        </button>
      </aside>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-dialog-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
            <h3 id="submit-dialog-title" className="text-lg font-bold text-slate-900">
              Submit test?
            </h3>
            <ul className="mt-3 space-y-1 text-sm text-slate-700">
              <li>Answered: {answeredCount}</li>
              <li>Unanswered: {unansweredCount}</li>
              <li>Marked for review: {marked.size}</li>
              <li>Time left: {formatTime(timeLeft)}</li>
            </ul>
            {unansweredCount > 0 && (
              <p className="mt-3 text-sm text-amber-700">Unanswered questions will be scored as incorrect.</p>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-full border border-slate-300 bg-surface px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Keep going
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
