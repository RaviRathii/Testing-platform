import { Fragment, type ReactNode } from "react";

// Renders the small Markdown subset the interviewer uses: ``` code fences, `inline code`, and **bold**.
// Everything is emitted as React text nodes, so message content can never inject HTML.

function renderInline(text: string): ReactNode[] {
  return text.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*)/g).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={index} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.9em] text-slate-800">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

export function ChatText({ text }: { text: string }) {
  // Odd-indexed segments are inside ``` fences (an unclosed fence while streaming still renders as code).
  const segments = text.split(/```/);

  return (
    <div className="space-y-3 text-sm leading-6">
      {segments.map((segment, index) => {
        if (index % 2 === 1) {
          const newline = segment.indexOf("\n");
          const code = newline >= 0 ? segment.slice(newline + 1) : segment;
          return (
            <pre key={index} className="overflow-x-auto rounded-xl bg-ink p-3 font-mono text-xs leading-5 text-white/90">
              <code>{code.replace(/\n$/, "")}</code>
            </pre>
          );
        }
        const trimmed = segment.replace(/^\n+|\n+$/g, "");
        return trimmed ? (
          <p key={index} className="whitespace-pre-wrap break-words">
            {renderInline(trimmed)}
          </p>
        ) : null;
      })}
    </div>
  );
}
