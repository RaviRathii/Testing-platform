// Shared interview configuration, safe to import from both server and client code.

export const interviewTracks = {
  DSA: {
    label: "DSA",
    name: "Data Structures & Algorithms",
    description: "Problem solving, complexity analysis, and writing correct code.",
  },
  SYSTEM_DESIGN: {
    label: "System Design",
    name: "System Design",
    description: "Designing scalable services: requirements, architecture, and trade-offs.",
  },
  DEVELOPMENT: {
    label: "Development",
    name: "Software Development",
    description: "Practical engineering: language depth, APIs, debugging, testing, and code quality.",
  },
} as const;

export type InterviewTrackKey = keyof typeof interviewTracks;
export const interviewTrackKeys = Object.keys(interviewTracks) as InterviewTrackKey[];

export const interviewLevels = {
  JUNIOR: { label: "Junior", description: "0–2 years" },
  MID: { label: "Mid-level", description: "2–5 years" },
  SENIOR: { label: "Senior", description: "5+ years" },
} as const;

export type InterviewLevelKey = keyof typeof interviewLevels;
export const interviewLevelKeys = Object.keys(interviewLevels) as InterviewLevelKey[];

/**
 * The interviewer reply is streamed as plain text. If it fails part-way, the server appends
 * this marker followed by an error message, since the HTTP status has already been sent.
 */
export const STREAM_ERROR_MARKER = "\u0000ERROR:";

export const PANEL_PRICE_INR = 399;
export const PANEL_DURATION_MINUTES = 60;

export const bookingStatusLabels = {
  PENDING_PAYMENT: "Pending payment",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
} as const;

export type BookingStatusKey = keyof typeof bookingStatusLabels;

// Panel interviews run in hourly slots, in India Standard Time.
export const SLOT_START_HOUR_IST = 10;
export const SLOT_END_HOUR_IST = 21; // last slot starts at 20:00
export const BOOKING_WINDOW_DAYS = 14;
/** Slots must be booked at least this far ahead so the panel can be arranged. */
export const MIN_LEAD_HOURS = 3;

export const IST_TIME_ZONE = "Asia/Kolkata";
const IST_OFFSET_MINUTES = 5 * 60 + 30; // IST has no daylight saving

/** "2026-10-08" for the IST calendar date of the given instant. */
export function istDateKey(instant: Date) {
  return new Date(instant.getTime() + IST_OFFSET_MINUTES * 60_000).toISOString().slice(0, 10);
}

/** The UTC instant for a given IST date ("YYYY-MM-DD") and hour. */
export function istSlotToDate(dateKey: string, hour: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, 0) - IST_OFFSET_MINUTES * 60_000);
}

/** The next BOOKING_WINDOW_DAYS IST dates, starting today. */
export function bookableDateKeys(now = new Date()) {
  const today = istDateKey(now);
  return Array.from({ length: BOOKING_WINDOW_DAYS }, (_, index) => {
    const date = new Date(`${today}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

/** Every slot start on an IST date, whether or not it's still bookable. */
export function slotsForDate(dateKey: string) {
  return Array.from({ length: SLOT_END_HOUR_IST - SLOT_START_HOUR_IST }, (_, index) =>
    istSlotToDate(dateKey, SLOT_START_HOUR_IST + index),
  );
}

export function formatIst(instant: Date | string, options: Intl.DateTimeFormatOptions) {
  return new Date(instant).toLocaleString("en-IN", { timeZone: IST_TIME_ZONE, ...options });
}
