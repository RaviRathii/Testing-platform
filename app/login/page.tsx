"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@mocktest.local");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as { user?: { isAdmin?: boolean }; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Login failed");
      }

      if (data.user?.isAdmin) {
        window.location.href = "/admin";
        return;
      }

      window.location.href = "/questions";
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-16 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-surface p-8 shadow-lg shadow-slate-200/60">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">Platform access</p>
          <h1 className="mt-3 text-3xl font-bold">Login</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none ring-0 transition focus:border-indigo-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none ring-0 transition focus:border-indigo-500"
              placeholder="••••••••"
            />
          </div>

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <button
          type="button"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-surface px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          onClick={() => {
            window.location.href = "/api/auth/google";
          }}
        >
          <span aria-hidden="true">G</span>
          Sign in with Google
        </button>

        <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-700">
          Default admin login: admin@mocktest.local / Admin@123
        </div>

        <div className="mt-6 text-center text-sm text-slate-600">
          New user? <a href="/signup" className="font-semibold text-indigo-700">Create account</a>
        </div>
      </div>
    </main>
  );
}
