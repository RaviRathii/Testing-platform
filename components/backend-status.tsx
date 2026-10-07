"use client";

import { useEffect, useState } from "react";
import { buildApiUrl } from "@/lib/api";

type BackendStatus = "loading" | "connected" | "disconnected";

export function BackendStatus() {
  const [status, setStatus] = useState<BackendStatus>("loading");

  useEffect(() => {
    let isMounted = true;

    const checkBackend = async () => {
      try {
        const response = await fetch(buildApiUrl("/health"), {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Health check failed");
        }

        const data = (await response.json()) as { status?: string };

        if (isMounted) {
          setStatus(data.status === "UP" ? "connected" : "disconnected");
        }
      } catch {
        if (isMounted) {
          setStatus("disconnected");
        }
      }
    };

    checkBackend();

    return () => {
      isMounted = false;
    };
  }, []);

  const label =
    status === "loading"
      ? "Checking backend..."
      : status === "connected"
        ? "Backend Status: Connected"
        : "Backend Status: Disconnected";

  return (
    <div className="rounded-2xl border border-slate-200 bg-surface/80 p-4 shadow-sm backdrop-blur-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        Platform status
      </p>
      <p className="mt-2 text-lg font-medium text-slate-900">{label}</p>
    </div>
  );
}
