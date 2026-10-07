import Link from "next/link";
import { MockTestRunner } from "@/components/mock-test-runner";

export default async function MockTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link href="/tests" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            ← All mock tests
          </Link>
        </div>

        <MockTestRunner testId={id} />
      </div>
    </main>
  );
}
