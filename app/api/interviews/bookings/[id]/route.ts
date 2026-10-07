import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { isObjectId } from "@/lib/interview-sessions";
import { prisma } from "@/lib/prisma";

// Candidates can only cancel; everything else is managed by admins.
const updateSchema = z.object({ status: z.literal("CANCELLED") });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const { id } = await params;
  const payload = updateSchema.safeParse(await request.json().catch(() => ({})));

  if (!payload.success) {
    return NextResponse.json({ error: "Only cancellation is supported." }, { status: 400 });
  }

  const booking = isObjectId(id) ? await prisma.interviewBooking.findFirst({ where: { id, userId: user.id } }) : null;

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (!["PENDING_PAYMENT", "CONFIRMED"].includes(booking.status) || booking.scheduledAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: "This booking can no longer be cancelled." }, { status: 409 });
  }

  const updated = await prisma.interviewBooking.update({ where: { id }, data: { status: "CANCELLED" } });
  return NextResponse.json({ id: updated.id, status: updated.status });
}
