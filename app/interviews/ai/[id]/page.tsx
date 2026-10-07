import Link from "next/link";
import { InterviewChat } from "@/components/interview-chat";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AiInterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="min-h-screen px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/interviews" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            ← All interviews
          </Link>
          <ThemeToggle />
        </div>
        <InterviewChat sessionId={id} />
      </div>
    </main>
  );
}
