import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { isBookableSlot, takenSlotTimes } from "@/lib/interview-bookings";
import { interviewTrackKeys, PANEL_DURATION_MINUTES, PANEL_PRICE_INR } from "@/lib/interviews";
import { prisma } from "@/lib/prisma";

const bookingSchema = z.object({
  track: z.enum(interviewTrackKeys as [string, ...string[]]),
  startsAt: z.string().datetime(),
  notes: z.string().trim().max(1000).optional(),
});

const bookingFields = {
  id: true,
  track: true,
  scheduledAt: true,
  durationMinutes: true,
  priceInr: true,
  status: true,
  notes: true,
  interviewerName: true,
  meetingLink: true,
  createdAt: true,
} as const;

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const bookings = await prisma.interviewBooking.findMany({
    where: { userId: user.id },
    orderBy: { scheduledAt: "desc" },
    select: bookingFields,
  });

  return NextResponse.json({ bookings });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Log in to book an interview." }, { status: 401 });
  }

  const payload = bookingSchema.safeParse(await request.json().catch(() => ({})));

  if (!payload.success) {
    return NextResponse.json({ error: "Choose an interview type and a time slot." }, { status: 400 });
  }

  const startsAt = new Date(payload.data.startsAt);

  if (!isBookableSlot(startsAt)) {
    return NextResponse.json({ error: "That time slot can't be booked. Please choose another." }, { status: 400 });
  }

  // Check-then-create: two requests in the same instant could both pass. Admins resolve
  // the rare double booking when confirming payment.
  const taken = await takenSlotTimes(startsAt, new Date(startsAt.getTime() + 1));
  if (taken.size > 0) {
    return NextResponse.json({ error: "Someone just booked that slot. Please choose another." }, { status: 409 });
  }

  const booking = await prisma.interviewBooking.create({
    data: {
      userId: user.id,
      track: payload.data.track as "DSA" | "SYSTEM_DESIGN" | "DEVELOPMENT",
      scheduledAt: startsAt,
      durationMinutes: PANEL_DURATION_MINUTES,
      priceInr: PANEL_PRICE_INR,
      notes: payload.data.notes || null,
    },
    select: bookingFields,
  });

  return NextResponse.json({ booking }, { status: 201 });
}
