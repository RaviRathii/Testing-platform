import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const bookings = await prisma.interviewBooking.findMany({
    orderBy: { scheduledAt: "asc" },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(
    bookings.map((booking) => ({
      id: booking.id,
      track: booking.track,
      scheduledAt: booking.scheduledAt,
      durationMinutes: booking.durationMinutes,
      priceInr: booking.priceInr,
      status: booking.status,
      notes: booking.notes,
      interviewerName: booking.interviewerName,
      meetingLink: booking.meetingLink,
      createdAt: booking.createdAt,
      candidate: booking.user,
    })),
  );
}
