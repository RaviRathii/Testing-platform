import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  isPublished: z.boolean(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { id } = await params;
  const payload = updateSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "Update payload is invalid." }, { status: 400 });
  }

  if (!/^[0-9a-f]{24}$/i.test(id) || !(await prisma.mockTest.findUnique({ where: { id }, select: { id: true } }))) {
    return NextResponse.json({ error: "Mock test not found." }, { status: 404 });
  }

  const test = await prisma.mockTest.update({
    where: { id },
    data: { isPublished: payload.data.isPublished },
  });

  return NextResponse.json({ id: test.id, isPublished: test.isPublished });
}
