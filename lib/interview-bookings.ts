import { bookableDateKeys, istDateKey, MIN_LEAD_HOURS, slotsForDate } from "@/lib/interviews";
import { prisma } from "@/lib/prisma";

const ACTIVE_STATUSES = ["PENDING_PAYMENT", "CONFIRMED", "COMPLETED"] as const;

/** Start times already taken by a booking that hasn't been cancelled (the panel runs one interview at a time). */
export async function takenSlotTimes(from: Date, to: Date) {
  const bookings = await prisma.interviewBooking.findMany({
    where: { scheduledAt: { gte: from, lt: to }, status: { in: [...ACTIVE_STATUSES] } },
    select: { scheduledAt: true },
  });
  return new Set(bookings.map((booking) => booking.scheduledAt.getTime()));
}

export async function slotAvailability(dateKey: string, now = new Date()) {
  const slots = slotsForDate(dateKey);
  if (slots.length === 0) {
    return [];
  }

  const earliest = now.getTime() + MIN_LEAD_HOURS * 60 * 60 * 1000;
  const taken = await takenSlotTimes(slots[0], new Date(slots[slots.length - 1].getTime() + 1));

  return slots.map((startsAt) => ({
    startsAt: startsAt.toISOString(),
    available: startsAt.getTime() >= earliest && !taken.has(startsAt.getTime()),
  }));
}

/** True when the instant is exactly one of the published slot starts inside the booking window. */
export function isBookableSlot(startsAt: Date, now = new Date()) {
  const dateKey = istDateKey(startsAt);
  return (
    bookableDateKeys(now).includes(dateKey) &&
    slotsForDate(dateKey).some((slot) => slot.getTime() === startsAt.getTime()) &&
    startsAt.getTime() >= now.getTime() + MIN_LEAD_HOURS * 60 * 60 * 1000
  );
}
