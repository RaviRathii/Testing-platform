// Client-safe copy of the report shape (lib/ai-interviewer.ts is server-only because it builds the API client).
export type InterviewReportData = {
  overallScore: number;
  recommendation: "strong_no_hire" | "no_hire" | "lean_no_hire" | "lean_hire" | "hire" | "strong_hire";
  summary: string;
  strengths: string[];
  improvements: string[];
  competencies: { name: string; score: number; comment: string }[];
  nextSteps: string[];
};

const recommendationStyle: Record<InterviewReportData["recommendation"], { label: string; className: string }> = {
  strong_no_hire: { label: "Strong no hire", className: "bg-rose-100 text-rose-800" },
  no_hire: { label: "No hire", className: "bg-rose-50 text-rose-700" },
  lean_no_hire: { label: "Lean no hire", className: "bg-amber-50 text-amber-800" },
  lean_hire: { label: "Lean hire", className: "bg-emerald-50 text-emerald-700" },
  hire: { label: "Hire", className: "bg-emerald-100 text-emerald-800" },
  strong_hire: { label: "Strong hire", className: "bg-emerald-100 text-emerald-900" },
};

const scoreColor = (score: number) => (score >= 7 ? "bg-emerald-500" : score >= 5 ? "bg-amber-500" : "bg-rose-500");

function List({ title, items, tone }: { title: string; items: string[]; tone: "good" | "improve" | "next" }) {
  const marker = tone === "good" ? "✓" : tone === "improve" ? "→" : "•";
  const markerClass = tone === "good" ? "text-emerald-600" : tone === "improve" ? "text-amber-600" : "text-indigo-600";
  return (
    <section>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-slate-700">
            <span className={`shrink-0 font-semibold ${markerClass}`} aria-hidden>
              {marker}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function InterviewReportView({ report }: { report: InterviewReportData }) {
  const recommendation = recommendationStyle[report.recommendation];

  return (
    <section aria-labelledby="report-heading" className="rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-2xl bg-indigo-50">
          <span className="text-4xl font-bold text-indigo-700">{report.overallScore}</span>
          <span className="text-xs font-medium text-indigo-700">out of 10</span>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="report-heading" className="text-xl font-bold text-slate-900">
              Your feedback report
            </h2>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${recommendation.className}`}>
              {recommendation.label}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{report.summary}</p>
        </div>
      </div>

      {report.competencies.length > 0 && (
        <section className="mt-6">
          <h3 className="font-semibold text-slate-900">Competencies</h3>
          <ul className="mt-3 space-y-4">
            {report.competencies.map((competency) => (
              <li key={competency.name}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-800">{competency.name}</span>
                  <span className="font-semibold text-slate-900">{competency.score}/10</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${scoreColor(competency.score)}`} style={{ width: `${competency.score * 10}%` }} />
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">{competency.comment}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {report.strengths.length > 0 && <List title="What went well" items={report.strengths} tone="good" />}
        {report.improvements.length > 0 && <List title="What to improve" items={report.improvements} tone="improve" />}
      </div>
      {report.nextSteps.length > 0 && (
        <div className="mt-6">
          <List title="Practise next" items={report.nextSteps} tone="next" />
        </div>
      )}
    </section>
  );
}
