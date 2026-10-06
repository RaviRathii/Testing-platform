import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "mocktest_session";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "local-dev-session-secret-change-me";

export type SessionPayload = {
  userId: string;
  isAdmin: boolean;
  exp: number;
};

function encodeBase64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function signSession(payload: Omit<SessionPayload, "exp">): string {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;
  const body = encodeBase64Url(JSON.stringify({ ...payload, exp: expiresAt }));
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(body)
    .digest("base64url");

  return `${body}.${signature}`;
}

export function verifySession(value?: string): SessionPayload | null {
  if (!value) {
    return null;
  }

  const [body, signature] = value.split(".");

  if (!body || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(body)
    .digest("base64url");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(body)) as SessionPayload;

    if (!payload.userId || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, payload: Omit<SessionPayload, "exp">) {
  response.cookies.set(SESSION_COOKIE, signSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE)?.value;
  const payload = verifySession(value);

  if (!payload) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      subscription: true,
    },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user || !user.isAdmin) {
    throw new Error("Forbidden");
  }

  return user;
}

export function hasActiveSubscription(subscription?: { plan?: string | null; status?: string | null } | null) {
  const plan = subscription?.plan ?? "FREE";
  const status = subscription?.status ?? "ACTIVE";
  return plan !== "FREE" && status === "ACTIVE";
}

export async function ensureDefaultAdmin() {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@mocktest.local" },
  });

  if (existingAdmin) {
    return existingAdmin;
  }

  const bcrypt = await import("bcryptjs");

  const admin = await prisma.user.create({
    data: {
      name: "Platform Admin",
      email: "admin@mocktest.local",
      passwordHash: await bcrypt.hash("Admin@123", 10),
      isAdmin: true,
    },
  });

  await prisma.subscription.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      plan: "PREMIUM",
      status: "ACTIVE",
      startsAt: new Date(),
    },
  });

  return admin;
}
