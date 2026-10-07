import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { isObjectId } from "@/lib/interview-sessions";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  status: z.enum(["PENDING_PAYMENT", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
  interviewerName: z.string().trim().max(120).nullable().optional(),
  meetingLink: z
    .string()
    .trim()
    .max(500)
    .refine((value) => value === "" || /^https:\/\//i.test(value), "Meeting links must start with https://")
    .nullable()
    .optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { id } = await params;
  const payload = updateSchema.safeParse(await request.json().catch(() => ({})));

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.issues[0]?.message ?? "Update is invalid." }, { status: 400 });
  }

  if (!isObjectId(id) || !(await prisma.interviewBooking.findUnique({ where: { id }, select: { id: true } }))) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const { status, interviewerName, meetingLink } = payload.data;
  const booking = await prisma.interviewBooking.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(interviewerName !== undefined ? { interviewerName: interviewerName || null } : {}),
      ...(meetingLink !== undefined ? { meetingLink: meetingLink || null } : {}),
    },
  });

  return NextResponse.json({
    id: booking.id,
    status: booking.status,
    interviewerName: booking.interviewerName,
    meetingLink: booking.meetingLink,
  });
}
