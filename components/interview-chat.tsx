"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChatText } from "@/components/chat-text";
import { InterviewReportView, type InterviewReportData } from "@/components/interview-report";
import { interviewLevels, interviewTracks, STREAM_ERROR_MARKER, type InterviewLevelKey, type InterviewTrackKey } from "@/lib/interviews";

type ChatMessage = { role: "user" | "assistant"; content: string };

type SessionData = {
  id: string;
  track: InterviewTrackKey;
  level: InterviewLevelKey;
  status: "IN_PROGRESS" | "COMPLETED";
  messages: ChatMessage[];
  report: InterviewReportData | null;
  aiConfigured: boolean;
  limits: { maxCandidateMessages: number; maxMessageChars: number };
};

export function InterviewChat({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [turnError, setTurnError] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState("");
  const [report, setReport] = useState<InterviewReportData | null>(null);
  const openedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Sends a candidate answer, or with no content starts the interview / retries a failed reply.
  const requestTurn = useCallback(
    async (content?: string) => {
      setStreaming(true);
      setTurnError("");
      setMessages((current) => [
        ...current,
        ...(content ? [{ role: "user" as const, content }] : []),
        { role: "assistant" as const, content: "" },
      ]);

      const showError = (message: string) => {
        setTurnError(message);
        // Drop the empty or partial interviewer bubble; the server didn't save it.
        setMessages((current) => (current.at(-1)?.role === "assistant" ? current.slice(0, -1) : current));
      };

      try {
        const response = await fetch(`/api/interviews/ai/${sessionId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(content ? { content } : {}),
        });

        if (!response.ok || !response.body) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          if (content) {
            // The answer wasn't saved, so put it back in the box.
            setMessages((current) => current.slice(0, -2));
            setDraft(content);
          } else {
            setMessages((current) => current.slice(0, -1));
          }
          setTurnError(data.error ?? "Couldn't reach the interviewer. Please retry.");
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let reply = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          reply += decoder.decode(value, { stream: true });

          const markerIndex = reply.indexOf(STREAM_ERROR_MARKER);
          if (markerIndex >= 0) {
            // Keep reading so the full error message arrives.
            continue;
          }
          setMessages((current) => [...current.slice(0, -1), { role: "assistant", content: reply }]);
        }

        const markerIndex = reply.indexOf(STREAM_ERROR_MARKER);
        if (markerIndex >= 0) {
          showError(reply.slice(markerIndex + STREAM_ERROR_MARKER.length));
        } else if (!reply.trim()) {
          showError("The interviewer didn't respond. Please retry.");
        }
      } catch {
        showError("Connection lost. Please retry.");
      } finally {
        setStreaming(false);
      }
    },
    [sessionId],
  );

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`/api/interviews/ai/${sessionId}`, { cache: "no-store" });
        const data = (await response.json()) as SessionData & { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "Couldn't load this interview.");
        }
        setSession(data);
        setMessages(data.messages);
        setReport(data.report);

        // Start the interview the first time it's opened. The ref guards against React's double effect in dev.
        if (data.status === "IN_PROGRESS" && data.aiConfigured && !openedRef.current) {
          const last = data.messages.at(-1);
          if (data.messages.length === 0 || last?.role === "user") {
            openedRef.current = true;
            void requestTurn();
          }
        }
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Couldn't load this interview.");
      }
    };

    void load();
  }, [requestTurn, sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, turnError]);

  const send = () => {
    const content = draft.trim();
    if (!content || streaming) return;
    setDraft("");
    void requestTurn(content);
  };

  const finish = async () => {
    if (!window.confirm("End the interview and get your feedback report? You won't be able to answer more questions.")) {
      return;
    }
    setFinishing(true);
    setFinishError("");
    try {
      const response = await fetch(`/api/interviews/ai/${sessionId}/finish`, { method: "POST" });
      const data = (await response.json()) as { report?: InterviewReportData; error?: string };
      if (!response.ok || !data.report) {
        throw new Error(data.error ?? "Couldn't generate your feedback report.");
      }
      setReport(data.report);
      setSession((current) => (current ? { ...current, status: "COMPLETED" } : current));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setFinishError(error instanceof Error ? error.message : "Couldn't generate your feedback report.");
    } finally {
      setFinishing(false);
    }
  };

  if (loadError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
        <p>{loadError}</p>
        <Link href="/interviews" className="mt-3 inline-block text-sm font-semibold underline">
          Back to interviews
        </Link>
      </div>
    );
  }

  if (!session) {
    return <div className="rounded-2xl border border-slate-200 bg-surface p-6 text-sm text-slate-500">Loading interview...</div>;
  }

  const track = interviewTracks[session.track];
  const level = interviewLevels[session.level];
  const answers = messages.filter((message) => message.role === "user").length;
  const completed = session.status === "COMPLETED";
  const atLimit = answers >= session.limits.maxCandidateMessages;
  const lastIsUser = messages.at(-1)?.role === "user";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">AI mock interview</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {track.label} · {level.label}
          </h1>
        </div>
        {!completed && (
          <button
            type="button"
            onClick={() => void finish()}
            disabled={finishing || streaming || answers === 0}
            title={answers === 0 ? "Answer at least one question first" : undefined}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {finishing ? "Writing your feedback..." : "End interview"}
          </button>
        )}
      </div>

      {finishing && (
        <div role="status" className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800">
          Reviewing your interview and writing your feedback report. This can take up to a minute.
        </div>
      )}
      {finishError && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {finishError}
        </div>
      )}

      {report && <InterviewReportView report={report} />}

      {!session.aiConfigured && !completed && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          AI interviews aren&apos;t available right now. Please check back later.
        </div>
      )}

      <section aria-label="Interview transcript" className="rounded-2xl border border-slate-200 bg-surface shadow-sm">
        {completed && (
          <h2 className="border-b border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Transcript</h2>
        )}
        <ol className="space-y-5 p-5" aria-live="polite">
          {messages.map((message, index) => (
            <li key={index} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  message.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
                }`}
                aria-hidden
              >
                {message.role === "user" ? "You" : "AI"}
              </span>
              <div
                className={`min-w-0 max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === "user" ? "bg-indigo-50 text-slate-900" : "bg-slate-50 text-slate-800"
                }`}
              >
                <span className="sr-only">{message.role === "user" ? "You said:" : "Interviewer said:"}</span>
                {message.content ? (
                  <ChatText text={message.content} />
                ) : (
                  <span className="flex gap-1 py-2" aria-label="Interviewer is typing">
                    {[0, 150, 300].map((delay) => (
                      <span key={delay} className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>

        {turnError && (
          <div role="alert" className="mx-5 mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <span>{turnError}</span>
            {lastIsUser || messages.length === 0 ? (
              <button type="button" onClick={() => void requestTurn()} className="font-semibold underline">
                Retry
              </button>
            ) : null}
          </div>
        )}
        <div ref={bottomRef} />

        {!completed && session.aiConfigured && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
            className="border-t border-slate-200 p-4"
          >
            <label htmlFor="answer" className="sr-only">
              Your answer
            </label>
            <textarea
              id="answer"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                  event.preventDefault();
                  send();
                }
              }}
              disabled={streaming || atLimit || lastIsUser}
              maxLength={session.limits.maxMessageChars}
              rows={4}
              placeholder={atLimit ? "Message limit reached. End the interview to get feedback." : "Type your answer. Use ``` for code blocks."}
              className="w-full resize-y rounded-xl border border-slate-300 bg-surface px-3 py-2.5 font-mono text-sm text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Ctrl + Enter to send · {answers}/{session.limits.maxCandidateMessages} answers
              </p>
              <button
                type="submit"
                disabled={streaming || !draft.trim() || atLimit || lastIsUser}
                className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {streaming ? "Interviewer is replying..." : "Send"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
