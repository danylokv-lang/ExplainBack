import Link from "next/link";
import { notFound } from "next/navigation";
import { DiagnosisView } from "@/components/DiagnosisView";
import { currentUser } from "@/lib/auth";
import { getRun } from "@/lib/db";
import { dictionary, formatDate, getLocale } from "@/lib/i18n";

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = (await currentUser())!;
  const locale = await getLocale();
  const t = dictionary(locale);
  const run = await getRun(user.id, Number(id));
  if (!run || run.attempts.length === 0) notFound();

  const latest = run.attempts[run.attempts.length - 1];

  return (
    <div className="pt-12">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <Link href="/app/history" className="text-[0.9375rem] text-ink-2 hover:text-ink">
          {t.history.backToHistory}
        </Link>
        <span className="text-sm text-ink-3">{formatDate(locale, run.createdAt)}</span>
      </div>

      <h1 className="display mt-6 text-3xl">{run.topic}</h1>

      <details className="panel mt-5 p-5">
        <summary className="cursor-pointer select-none font-medium text-ink-2 hover:text-ink">
          {t.history.whatYouWrote(latest.index)}
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
          {t.history.explainAgain}
        </Link>
      </div>
    </div>
  );
}
