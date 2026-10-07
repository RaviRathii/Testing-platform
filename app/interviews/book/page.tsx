"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import {
  bookableDateKeys,
  formatIst,
  interviewTrackKeys,
  interviewTracks,
  istSlotToDate,
  PANEL_DURATION_MINUTES,
  PANEL_PRICE_INR,
  type InterviewTrackKey,
} from "@/lib/interviews";

type Slot = { startsAt: string; available: boolean };
type BookedSlot = { startsAt: string; track: InterviewTrackKey };

export default function BookInterviewPage() {
  const dates = useMemo(() => bookableDateKeys(), []);
  const [track, setTrack] = useState<InterviewTrackKey>("DSA");
  const [date, setDate] = useState(dates[0]);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotsError, setSlotsError] = useState("");
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [booked, setBooked] = useState<BookedSlot | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/interviews/slots?date=${date}`, { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as { slots?: Slot[]; error?: string };
        if (cancelled) return;
        if (!response.ok || !data.slots) throw new Error(data.error ?? "Couldn't load time slots.");
        setSlots(data.slots);
        setSlotsError("");
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setSlotsError(loadError instanceof Error ? loadError.message : "Couldn't load time slots.");
      });

    return () => {
      cancelled = true;
    };
  }, [date]);

  const chooseDate = (next: string) => {
    setDate(next);
    setSlots(null);
    setStartsAt(null);
  };

  const submit = async () => {
    if (!startsAt) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/interviews/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track, startsAt, notes: notes.trim() || undefined }),
      });
      const data = (await response.json()) as { error?: string };
      if (response.status === 401) {
        setNeedsLogin(true);
        return;
      }
      if (!response.ok) {
        // The slot may have just been taken; refresh availability.
        setSlots(null);
        setStartsAt(null);
        const refreshed = await fetch(`/api/interviews/slots?date=${date}`, { cache: "no-store" });
        if (refreshed.ok) setSlots(((await refreshed.json()) as { slots: Slot[] }).slots);
        throw new Error(data.error ?? "Couldn't book this slot.");
      }
      setBooked({ startsAt, track });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Couldn't book this slot.");
    } finally {
      setSubmitting(false);
    }
  };

  if (booked) {
    return (
      <main className="min-h-screen text-slate-900">
        <SiteHeader />
        <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
          <div className="rounded-3xl border border-slate-200 bg-surface p-8 text-center shadow-sm">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl text-emerald-700" aria-hidden>
              ✓
            </span>
            <h1 className="mt-4 text-2xl font-bold">Booking requested</h1>
            <p className="mt-2 text-slate-600">
              {interviewTracks[booked.track].label} interview on{" "}
              <strong className="text-slate-900">
                {formatIst(booked.startsAt, { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })} IST
              </strong>
              .
            </p>
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Your slot is held while payment is pending. We&apos;ll email you to collect ₹{PANEL_PRICE_INR} and confirm; the
              meeting link will appear on your Interviews page once confirmed.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/interviews" className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
                View my bookings
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-slate-900">
      <SiteHeader />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/interviews" className="text-sm font-medium text-indigo-700 hover:text-indigo-500">
          ← Interviews
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Book an expert panel interview</h1>
        <p className="mt-2 text-slate-600">
          {PANEL_DURATION_MINUTES}-minute live mock interview · ₹{PANEL_PRICE_INR}. All times are in IST.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0 space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm">
              <h2 className="font-semibold">1. Interview type</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {interviewTrackKeys.map((key) => (
                  <label
                    key={key}
                    className={`cursor-pointer rounded-xl border p-3 ${
                      track === key ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input type="radio" name="track" checked={track === key} onChange={() => setTrack(key)} className="sr-only" />
                    <span className="block text-sm font-semibold">{interviewTracks[key].label}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-600">{interviewTracks[key].description}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm">
              <h2 className="font-semibold">2. Date</h2>
              <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Date">
                {dates.map((key) => {
                  const midday = istSlotToDate(key, 12);
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={date === key}
                      onClick={() => chooseDate(key)}
                      className={`flex w-16 shrink-0 flex-col items-center rounded-xl border py-2 ${
                        date === key ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-[11px] font-medium uppercase">{formatIst(midday, { weekday: "short" })}</span>
                      <span className="text-lg font-bold">{formatIst(midday, { day: "numeric" })}</span>
                      <span className="text-[11px]">{formatIst(midday, { month: "short" })}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm">
              <h2 className="font-semibold">3. Time</h2>
              {slotsError ? (
                <p className="mt-3 text-sm text-rose-700">{slotsError}</p>
              ) : !slots ? (
                <p className="mt-3 text-sm text-slate-500">Loading available times...</p>
              ) : slots.every((slot) => !slot.available) ? (
                <p className="mt-3 text-sm text-slate-500">No times left on this day. Please pick another date.</p>
              ) : (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6" role="radiogroup" aria-label="Time">
                  {slots.map((slot) => (
                    <button
                      key={slot.startsAt}
                      type="button"
                      role="radio"
                      aria-checked={startsAt === slot.startsAt}
                      disabled={!slot.available}
                      onClick={() => setStartsAt(slot.startsAt)}
                      className={`rounded-xl border py-2 text-sm font-semibold ${
                        startsAt === slot.startsAt
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : slot.available
                            ? "border-slate-200 text-slate-700 hover:border-indigo-300"
                            : "cursor-not-allowed border-slate-100 text-slate-400 line-through"
                      }`}
                    >
                      {formatIst(slot.startsAt, { hour: "numeric", minute: "2-digit" })}
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm">
              <label htmlFor="notes" className="font-semibold">
                4. Notes for your interviewer <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Target companies, your preferred language, topics you want to focus on..."
                className="mt-3 w-full rounded-xl border border-slate-300 bg-surface px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </section>
          </div>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm lg:sticky lg:top-24">
            <h2 className="font-semibold">Summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Interview</dt>
                <dd className="text-right font-medium">{interviewTracks[track].label}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">When</dt>
                <dd className="text-right font-medium">
                  {startsAt ? `${formatIst(startsAt, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} IST` : "Choose a time"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Duration</dt>
                <dd className="font-medium">{PANEL_DURATION_MINUTES} min</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-slate-200 pt-3 text-base">
                <dt className="font-semibold">Total</dt>
                <dd className="font-bold">₹{PANEL_PRICE_INR}</dd>
              </div>
            </dl>

            {error && (
              <p role="alert" className="mt-4 text-sm text-rose-700">
                {error}
              </p>
            )}
            {needsLogin ? (
              <Link href="/login" className="mt-5 block rounded-full bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-500">
                Log in to book
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => void submit()}
                disabled={!startsAt || submitting}
                className="mt-5 w-full rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Booking..." : "Request booking"}
              </button>
            )}
            <p className="mt-3 text-xs leading-5 text-slate-500">
              No payment now. We&apos;ll email you to collect payment and confirm your slot.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
