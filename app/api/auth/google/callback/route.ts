import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/auth/google/callback";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?error=google_auth_failed", request.url));
  }

  if (!googleClientId || !googleClientSecret) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", request.url));
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("google_oauth_state")?.value;
  const codeVerifier = cookieStore.get("google_oauth_verifier")?.value;

  if (!savedState || savedState !== state || !codeVerifier) {
    return NextResponse.redirect(new URL("/login?error=google_state_invalid", request.url));
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: googleClientId,
      client_secret: googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }).toString(),
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(new URL("/login?error=google_token_failed", request.url));
  }

  const tokenData = (await tokenResponse.json()) as { access_token?: string };
  const accessToken = tokenData.access_token;

  if (!accessToken) {
    return NextResponse.redirect(new URL("/login?error=google_token_missing", request.url));
  }

  const userInfoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!userInfoResponse.ok) {
    return NextResponse.redirect(new URL("/login?error=google_profile_failed", request.url));
  }

  const userInfo = (await userInfoResponse.json()) as {
    email?: string;
    name?: string;
    given_name?: string;
  };

  const email = userInfo.email?.trim().toLowerCase();
  const name = userInfo.name?.trim() || userInfo.given_name?.trim() || "Google User";

  if (!email) {
    return NextResponse.redirect(new URL("/login?error=google_email_missing", request.url));
  }

  let user = await prisma.user.findUnique({
    where: { email },
    include: { subscription: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: null,
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
  } else if (!user.subscription) {
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: "FREE",
        status: "ACTIVE",
        startsAt: new Date(),
      },
    });
  }

  const response = NextResponse.redirect(new URL("/questions", request.url));
  setSessionCookie(response, {
    userId: user.id,
    isAdmin: user.isAdmin,
  });

  response.cookies.set("google_oauth_state", "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  response.cookies.set("google_oauth_verifier", "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  cookieStore.set("google_oauth_state", "", { path: "/", maxAge: 0 });
  cookieStore.set("google_oauth_verifier", "", { path: "/", maxAge: 0 });

  return response;
}
