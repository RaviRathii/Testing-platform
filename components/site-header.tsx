"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { buildApiUrl } from "@/lib/api";

type HeaderUser = {
  name: string;
  isAdmin: boolean;
};

const navLinks = [
  { href: "/courses", label: "Courses" },
  { href: "/tests", label: "Mock tests" },
  { href: "/questions", label: "Practice" },
  { href: "/interviews", label: "Interviews" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  // undefined while loading, null when signed out.
  const [user, setUser] = useState<HeaderUser | null | undefined>(undefined);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch(buildApiUrl("/auth/me"), { cache: "no-store" });
        const data = response.ok ? ((await response.json()) as { user?: HeaderUser }) : null;
        setUser(data?.user ?? null);
      } catch {
        setUser(null);
      }
    };

    void loadUser();
  }, []);

  const handleLogout = async () => {
    await fetch(buildApiUrl("/auth/logout"), { method: "POST" });
    setUser(null);
    router.push("/login");
  };

  const links = user?.isAdmin ? [...navLinks, { href: "/admin", label: "Admin" }] : navLinks;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-surface/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:flex-nowrap sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm">
            M
          </span>
          <span className="hidden text-base font-semibold text-slate-900 sm:block">Mock Test Platform</span>
        </Link>

        <nav className="order-last -mx-3 flex w-full min-w-0 items-center gap-1 overflow-x-auto text-sm font-medium sm:order-none sm:mx-0 sm:w-auto">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 ${
                  isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          {user === undefined ? (
            <span className="h-9 w-24 animate-pulse rounded-full bg-slate-100" aria-hidden />
          ) : user ? (
            <>
              <Link
                href="/profile"
                className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm font-medium ${
                  pathname === "/profile"
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-surface text-slate-700 hover:border-slate-300"
                }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-32 truncate sm:block">{user.name}</span>
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:block"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink-hover"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
