"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import {
  bookingStatusLabels,
  formatIst,
  interviewLevelKeys,
  interviewLevels,
  interviewTrackKeys,
  interviewTracks,
  PANEL_PRICE_INR,
  type BookingStatusKey,
  type InterviewLevelKey,
  type InterviewTrackKey,
} from "@/lib/interviews";

type SessionSummary = {
  id: string;
  track: InterviewTrackKey;
  level: InterviewLevelKey;
  status: "IN_PROGRESS" | "COMPLETED";
  overallScore: number | null;
  createdAt: string;
};

type Usage = { limit: number | null; used: number; remaining: number | null; resetsAt: string };

type Booking = {
  id: string;
  track: InterviewTrackKey;
  scheduledAt: string;
  priceInr: number;
  status: BookingStatusKey;
  interviewerName: string | null;
  meetingLink: string | null;
};

const statusTone: Record<BookingStatusKey, string> = {
  PENDING_PAYMENT: "bg-amber-50 text-amber-800",
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  COMPLETED: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-slate-100 text-slate-500 line-through",
};

export default function InterviewsPage() {
  const router = useRouter();
  // Bookings are "upcoming" relative to page load; reading the clock during render isn't allowed.
  const [loadedAt] = useState(() => Date.now());
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [aiConfigured, setAiConfigured] = useState(true);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [track, setTrack] = useState<InterviewTrackKey>("DSA");
  const [level, setLevel] = useState<InterviewLevelKey>("MID");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const [sessionsResponse, bookingsResponse] = await Promise.all([
        fetch("/api/interviews/ai", { cache: "no-store" }),
        fetch("/api/interviews/bookings", { cache: "no-store" }),
      ]);

      if (sessionsResponse.status === 401) {
        setLoggedIn(false);
        return;
      }

      setLoggedIn(true);
      if (sessionsResponse.ok) {
        const data = (await sessionsResponse.json()) as { aiConfigured: boolean; sessions: SessionSummary[]; usage: Usage };
        setAiConfigured(data.aiConfigured);
        setSessions(data.sessions);
        setUsage(data.usage);
      }
      if (bookingsResponse.ok) {
        setBookings(((await bookingsResponse.json()) as { bookings: Booking[] }).bookings);
      }
    };

    void load().catch(() => setLoggedIn(false));
  }, []);

  const startInterview = async () => {
    setStarting(true);
    setError("");
    try {
      const response = await fetch("/api/interviews/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track, level }),
      });
      const data = (await response.json()) as { id?: string; error?: string; usage?: Usage };
      if (data.usage) setUsage(data.usage);
      if (!response.ok || !data.id) {
        throw new Error(data.error ?? "Couldn't start the interview.");
      }
      router.push(`/interviews/ai/${data.id}`);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Couldn't start the interview.");
      setStarting(false);
    }
  };

  const cancelBooking = async (booking: Booking) => {
    if (!window.confirm(`Cancel your ${interviewTracks[booking.track].label} interview on ${formatIst(booking.scheduledAt, { dateStyle: "medium", timeStyle: "short" })}?`)) {
      return;
    }
    const response = await fetch(`/api/interviews/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      window.alert(data.error ?? "Couldn't cancel this booking.");
      return;
    }
    setBookings((current) => current.map((item) => (item.id === booking.id ? { ...item, status: "CANCELLED" } : item)));
  };

  return (
    <main className="min-h-screen text-slate-900">
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">Interviews</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Practise engineering interviews</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Rehearse DSA, system design, and development rounds with an AI interviewer anytime, or book a live mock interview
          with our expert panel.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          {/* AI interview */}
          <section aria-labelledby="ai-heading" className="rounded-3xl border border-slate-200 bg-surface p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="ai-heading" className="text-xl font-bold">
                  AI interview
                </h2>
                <p className="mt-1 text-sm text-slate-600">Start right now. Get a scored feedback report when you finish.</p>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Free</span>
            </div>

            <fieldset className="mt-6">
              <legend className="text-sm font-semibold text-slate-800">Interview type</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {interviewTrackKeys.map((key) => (
                  <label
                    key={key}
                    className={`cursor-pointer rounded-2xl border p-3 ${
                      track === key ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input type="radio" name="track" value={key} checked={track === key} onChange={() => setTrack(key)} className="sr-only" />
                    <span className="block text-sm font-semibold text-slate-900">{interviewTracks[key].label}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-600">{interviewTracks[key].description}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-5">
              <legend className="text-sm font-semibold text-slate-800">Level</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {interviewLevelKeys.map((key) => (
                  <label
                    key={key}
                    className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium ${
                      level === key ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    <input type="radio" name="level" value={key} checked={level === key} onChange={() => setLevel(key)} className="sr-only" />
                    {interviewLevels[key].label}
                    <span className={`ml-1.5 text-xs ${level === key ? "text-white/80" : "text-slate-500"}`}>{interviewLevels[key].description}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {error && (
              <p role="alert" className="mt-4 text-sm text-rose-700">
                {error}
              </p>
            )}

            <div className="mt-6">
              {loggedIn === false ? (
                <Link href="/login" className="inline-block rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500">
                  Log in to start
                </Link>
              ) : aiConfigured && usage?.remaining === 0 ? (
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  You&apos;ve used today&apos;s {usage.limit} AI interview{usage.limit === 1 ? "" : "s"}. New interviews unlock at
                  midnight IST. You can still resume an unfinished one below.
                </p>
              ) : aiConfigured ? (
                <button
                  type="button"
                  onClick={() => void startInterview()}
                  disabled={starting || loggedIn === null}
                  className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                >
                  {starting ? "Starting..." : `Start ${interviewTracks[track].label} interview`}
                </button>
              ) : (
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">AI interviews are coming soon.</p>
              )}
              <p className="mt-3 text-xs text-slate-500">
                About 45 minutes. Your progress is saved, so you can come back to it.
                {usage?.limit != null && usage.remaining !== 0 && (
                  <>
                    {" "}
                    <span className="font-medium text-slate-700">
                      {usage.remaining} of {usage.limit} left today.
                    </span>
                  </>
                )}
              </p>
            </div>
          </section>

          {/* Panel interview */}
          <section aria-labelledby="panel-heading" className="flex flex-col rounded-3xl bg-ink p-6 text-white">
            <h2 id="panel-heading" className="text-xl font-bold">
              Expert panel interview
            </h2>
            <p className="mt-1 text-sm text-white/70">A live 1-hour mock interview with an experienced engineer.</p>
            <p className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold">₹{PANEL_PRICE_INR}</span>
              <span className="text-white/70">/hour</span>
            </p>
            <ul className="mt-6 space-y-2 text-sm text-white/80">
              {["DSA, System Design, or Development", "Pick any 1-hour slot in the next two weeks", "Detailed verbal and written feedback", "Video call link shared after confirmation"].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-emerald-400" aria-hidden>
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-7">
              <Link
                href={loggedIn === false ? "/login" : "/interviews/book"}
                className="inline-block rounded-full bg-surface px-6 py-3 text-sm font-semibold text-slate-900 hover:opacity-90"
              >
                Book a slot
              </Link>
            </div>
          </section>
        </div>

        {loggedIn && (sessions.length > 0 || bookings.length > 0) && (
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-slate-200 bg-surface p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Your panel bookings</h2>
              {bookings.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No bookings yet.</p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {bookings.map((booking) => {
                    const upcoming = new Date(booking.scheduledAt).getTime() > loadedAt;
                    return (
                      <li key={booking.id} className="py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-slate-900">{interviewTracks[booking.track].label}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone[booking.status]}`}>
                            {bookingStatusLabels[booking.status]}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-slate-600">
                          {formatIst(booking.scheduledAt, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} IST · ₹
                          {booking.priceInr}
                        </p>
                        {booking.status === "PENDING_PAYMENT" && (
                          <p className="mt-1 text-xs text-slate-500">We&apos;ll contact you by email to collect payment and confirm.</p>
                        )}
                        {booking.status === "CONFIRMED" && (
                          <p className="mt-1 text-xs text-slate-600">
                            {booking.interviewerName ? `Interviewer: ${booking.interviewerName} · ` : ""}
                            {booking.meetingLink ? (
                              <a href={booking.meetingLink} target="_blank" rel="noreferrer" className="font-semibold text-indigo-700 hover:text-indigo-500">
                                Join meeting
                              </a>
                            ) : (
                              "Meeting link coming soon."
                            )}
                          </p>
                        )}
                        {upcoming && (booking.status === "PENDING_PAYMENT" || booking.status === "CONFIRMED") && (
                          <button type="button" onClick={() => void cancelBooking(booking)} className="mt-1 text-xs font-medium text-slate-500 hover:text-rose-600">
                            Cancel booking
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-surface p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Your AI interviews</h2>
              {sessions.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No AI interviews yet.</p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {sessions.map((session) => (
                    <li key={session.id}>
                      <Link href={`/interviews/ai/${session.id}`} className="-mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-3 hover:bg-slate-50">
                        <span>
                          <span className="block font-medium text-slate-900">
                            {interviewTracks[session.track].label} · {interviewLevels[session.level].label}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {formatIst(session.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                          </span>
                        </span>
                        {session.status === "COMPLETED" && session.overallScore !== null ? (
                          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-sm font-bold text-indigo-700">{session.overallScore}/10</span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">Resume</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
