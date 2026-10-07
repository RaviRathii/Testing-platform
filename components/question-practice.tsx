"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { buildApiUrl } from "@/lib/api";

type SubscriptionStatus = {
  plan?: string;
  status?: string;
};

type Question = {
  id: string;
  category: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  questionText: string;
  options: string[];
  correctOption?: number;
  explanation?: string | null;
};

type Result = {
  attemptId?: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
};

type AuthUser = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
};

const EXAM_DURATION_MS = 60 * 60 * 1000;

type PracticeFilter = {
  /** RegExp source matched against question categories (RegExp objects can't cross the server/client boundary). */
  pattern: string;
  flags: string;
};

export function QuestionPractice({ title = "Question bank", filter }: { title?: string; filter?: PracticeFilter }) {
  const filterPattern = filter?.pattern;
  const filterFlags = filter?.flags;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<Result | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus>({ plan: "FREE", status: "ACTIVE" });
  const [user, setUser] = useState<AuthUser | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION_MS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasActiveSubscription =
    user !== null && (user.isAdmin || (subscription.plan && subscription.plan !== "FREE" && subscription.status !== "INACTIVE"));

  const currentQuestion = questions[currentIndex] ?? null;
  const answeredCount = useMemo(
    () => Object.keys(answers).filter((questionId) => answers[questionId] !== undefined).length,
    [answers],
  );

  const handleSubmit = useCallback(
    async (autoSubmit = false) => {
      if (questions.length === 0 || !hasActiveSubscription || isSubmitting || result) {
        return;
      }

      const payload = {
        answers: questions
          .filter((question) => answers[question.id] !== undefined)
          .map((question) => ({
            questionId: question.id,
            selectedOption: answers[question.id],
          })),
      };

      if (payload.answers.length === 0) {
        if (!autoSubmit) {
          window.alert("Please answer at least one question before submitting.");
        }
        return;
      }

      setIsSubmitting(true);

      try {
        const response = await fetch(buildApiUrl("/attempts"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = (await response.json()) as Result & { error?: string };

        if (!response.ok) {
          throw new Error(data.error ?? "Attempt failed");
        }

        setResult({
          attemptId: data.attemptId,
          score: data.score,
          totalQuestions: data.totalQuestions,
          correctAnswers: data.correctAnswers,
        });
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Unable to submit the mock exam.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [answers, hasActiveSubscription, isSubmitting, questions, result],
  );

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const meResponse = await fetch(buildApiUrl("/auth/me"), { cache: "no-store" });

        if (!meResponse.ok) {
          setUser(null);
          setQuestions([]);
          return;
        }

        const meData = (await meResponse.json()) as { user?: AuthUser };
        if (meData.user) {
          setUser(meData.user);
        }

        const [questionsResponse, subscriptionResponse] = await Promise.all([
          fetch(buildApiUrl("/questions"), { cache: "no-store" }),
          fetch(buildApiUrl("/subscriptions"), { cache: "no-store" }),
        ]);

        if (!questionsResponse.ok) {
          throw new Error("Failed to load questions");
        }

        const questionData = (await questionsResponse.json()) as Question[];
        const subscriptionData = (await subscriptionResponse.json()) as {
          subscription?: SubscriptionStatus;
        };

        const categoryMatch = filterPattern ? new RegExp(filterPattern, filterFlags) : null;
        setQuestions(
          categoryMatch ? questionData.filter((question) => categoryMatch.test(question.category)) : questionData,
        );
        setSubscription(subscriptionData.subscription ?? { plan: "FREE", status: "ACTIVE" });
      } catch {
        setQuestions([]);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void loadQuestions();
  }, [filterPattern, filterFlags]);

  useEffect(() => {
    if (!questions.length || result) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1000) {
          window.clearInterval(timer);
          void handleSubmit(true);
          return 0;
        }

        return previous - 1000;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [handleSubmit, questions.length, result]);

  const handleUpgrade = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    setUpgradeLoading(true);

    try {
      const response = await fetch(buildApiUrl("/subscriptions"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: "BASIC",
          status: "ACTIVE",
          amount: 49,
        }),
      });

      const data = (await response.json()) as {
        subscription?: SubscriptionStatus;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to activate subscription.");
      }

      setSubscription(data.subscription ?? { plan: "BASIC", status: "ACTIVE" });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to activate subscription.");
    } finally {
      setUpgradeLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6">Loading practice questions...</div>;
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-700">
        <p className="text-lg font-semibold text-slate-900">Login required</p>
        <p className="mt-2">Sign in to practise questions and review your result.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/login"
            className="inline-block rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Go to login
          </a>
          <a
            href="/signup"
            className="inline-block rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Create account
          </a>
        </div>
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <p className="text-lg font-semibold">Subscription required</p>
        <p className="mt-2 text-sm">Unlock practice questions and every mock test for ₹49/month.</p>
        <button
          type="button"
          onClick={() => {
            void handleUpgrade();
          }}
          disabled={upgradeLoading}
          className="mt-4 rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-65"
        >
          {upgradeLoading ? "Activating..." : "Subscribe for ₹49"}
        </button>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-700">
        No practice questions are available for this subject yet. Check back soon, or try another subject.
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Practice</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{title}</h2>
          </div>
          <div className="rounded-full bg-indigo-100 px-3 py-1.5 text-sm font-semibold text-indigo-700">
            Time left: {formatTime(timeLeft)}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10">
          {questions.map((question, index) => (
            <button
              key={question.id}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                currentIndex === index
                  ? "border-indigo-500 bg-indigo-600 text-white"
                  : answers[question.id] !== undefined
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {!result ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Question {currentIndex + 1} / {questions.length}
            </p>
            <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">
              {currentQuestion.category}
            </span>
          </div>

          <h3 className="text-xl font-semibold text-slate-900">{currentQuestion.questionText}</h3>

          <div className="mt-5 space-y-3">
            {currentQuestion.options.map((option, optionIndex) => (
              <label
                key={`${currentQuestion.id}-${optionIndex}`}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
                  answers[currentQuestion.id] === optionIndex
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  checked={answers[currentQuestion.id] === optionIndex}
                  onChange={() =>
                    setAnswers((current) => ({
                      ...current,
                      [currentQuestion.id]: optionIndex,
                    }))
                  }
                  className="mt-1"
                />
                <span className="text-slate-700">{option}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCurrentIndex((previous) => Math.max(0, previous - 1))}
                disabled={currentIndex === 0}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentIndex((previous) => Math.min(questions.length - 1, previous + 1))}
                disabled={currentIndex === questions.length - 1}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-600">{answeredCount}/{questions.length} answered</span>
              <button
                type="button"
                onClick={() => {
                  void handleSubmit(false);
                }}
                disabled={isSubmitting}
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-65"
              >
                {isSubmitting ? "Submitting..." : "Submit exam"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm text-emerald-900">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Attempt complete</p>
          <p className="mt-3 text-3xl font-bold">Score: {result.score}%</p>
          <p className="mt-2 text-base">
            {result.correctAnswers} of {result.totalQuestions} answers were correct.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {result.attemptId && (
              <Link
                href={`/results/${result.attemptId}`}
                className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
              >
                Review answers &amp; explanations
              </Link>
            )}
            <Link
              href="/profile"
              className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800"
            >
              View profile results
            </Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800"
            >
              Retake exam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
