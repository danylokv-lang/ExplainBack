import Link from "next/link";
import { notFound } from "next/navigation";
import { DiagnosisView } from "@/components/DiagnosisView";
import { currentUser } from "@/lib/auth";
import { getRun } from "@/lib/db";
import { formatDate } from "@/lib/plural";

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = (await currentUser())!;
  const run = getRun(user.id, Number(id));
  if (!run || run.attempts.length === 0) notFound();

  const latest = run.attempts[run.attempts.length - 1];

  return (
    <div className="pt-12">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <Link href="/app/history" className="text-[0.9375rem] text-ink-2 hover:text-ink">
          ← History
        </Link>
        <span className="text-sm text-ink-3">{formatDate(run.createdAt)}</span>
      </div>

      <h1 className="display mt-6 text-3xl">{run.topic}</h1>

      <details className="panel mt-5 p-5">
        <summary className="cursor-pointer select-none font-medium text-ink-2 hover:text-ink">
          What you wrote (attempt {latest.index})
        </summary>
        <p className="prose-measure mt-4 whitespace-pre-wrap text-[1.0625rem] leading-relaxed text-ink-2">
          {latest.explanation}
        </p>
      </details>

      <DiagnosisView map={run.map} attempts={run.attempts} runId={run.id} readOnly />

      <div className="pb-12">
        <Link
          href={`/app/practice?topic=${encodeURIComponent(run.topic)}`}
          className="btn btn-primary"
        >
          Explain This Again
        </Link>
      </div>
    </div>
  );
}
