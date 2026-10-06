import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const subscriptionSchema = z.object({
  plan: z.enum(["FREE", "BASIC", "PREMIUM"]).default("FREE"),
  status: z.enum(["ACTIVE", "INACTIVE", "TRIAL"]).default("ACTIVE"),
});

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const subscription = user.subscription ??
    (await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: "FREE",
        status: "ACTIVE",
        startsAt: new Date(),
      },
    }));

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    subscription: {
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      startsAt: subscription.startsAt,
      expiresAt: subscription.expiresAt,
    },
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const body = await request.json();
  const payload = subscriptionSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid subscription payload." }, { status: 400 });
  }

  const currentSubscription = user.subscription ??
    (await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: "FREE",
        status: "ACTIVE",
        startsAt: new Date(),
      },
    }));

  const updatedSubscription = await prisma.subscription.update({
    where: { id: currentSubscription.id },
    data: {
      plan: payload.data.plan,
      status: payload.data.status,
      expiresAt:
        payload.data.plan === "FREE"
          ? null
          : new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    subscription: {
      id: updatedSubscription.id,
      plan: updatedSubscription.plan,
      status: updatedSubscription.status,
      startsAt: updatedSubscription.startsAt,
      expiresAt: updatedSubscription.expiresAt,
    },
  });
}
