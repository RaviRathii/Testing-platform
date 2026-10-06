import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  const body = await request.json();
  const payload = registerSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
  }

  const email = payload.data.email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const bcrypt = await import("bcryptjs");
  const user = await prisma.user.create({
    data: {
      name: payload.data.name.trim(),
      email,
      passwordHash: await bcrypt.hash(payload.data.password, 10),
      isAdmin: false,
    },
    include: { subscription: true },
  });

  await prisma.subscription.create({
    data: {
      userId: user.id,
      plan: "FREE",
      status: "ACTIVE",
      startsAt: new Date(),
    },
  });

  const response = NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    subscription: {
      plan: "FREE",
      status: "ACTIVE",
    },
  });

  setSessionCookie(response, {
    userId: user.id,
    isAdmin: false,
  });

  return response;
}
