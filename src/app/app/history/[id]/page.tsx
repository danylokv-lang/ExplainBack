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

  return (
    <div className="pt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <Link href="/app/history" className="label hover:text-ink">
          ← History
        </Link>
        <span className="label">{formatDate(run.createdAt)}</span>
      </div>

      <p className="mt-6 font-display text-3xl leading-tight">{run.topic}</p>

      <details className="panel mt-5 p-5">
        <summary className="label cursor-pointer select-none hover:text-ink">
          What you wrote (attempt {run.attempts[run.attempts.length - 1].index})
        </summary>
        <p className="mt-3 whitespace-pre-wrap font-display text-base leading-relaxed text-ink-2">
          {run.attempts[run.attempts.length - 1].explanation}
        </p>
      </details>

      <DiagnosisView map={run.map} attempts={run.attempts} runId={run.id} readOnly />

      <div className="pb-10">
        <Link
          href={`/app/practice?topic=${encodeURIComponent(run.topic)}`}
          className="btn btn-primary"
        >
          Explain this again
        </Link>
      </div>
    </div>
  );
}
