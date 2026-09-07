import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { listRuns } from "@/lib/db";
import { dictionary, formatDate, getLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "History" };

export default async function HistoryPage() {
  const user = (await currentUser())!;
  const locale = await getLocale();
  const t = dictionary(locale);
  const runs = await listRuns(user.id);

  return (
    <div className="space-y-9 py-12">
      <header>
        <p className="label">{t.nav.history}</p>
        <h1 className="display mt-2 text-4xl">{t.history.heading}</h1>
        <p className="prose-measure mt-4 text-lg leading-relaxed text-ink-2">{t.history.body}</p>
      </header>

      {runs.length === 0 ? (
        <div className="panel p-6">
          <p className="leading-relaxed text-ink-2">{t.history.noSessions}</p>
          <Link href="/app/practice" className="btn btn-primary mt-5">
            {t.history.startFirst}
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-rule overflow-hidden rounded-2xl border border-rule bg-surface shadow-sm">
          {runs.map((run) => {
            const gain = run.lastDepth - run.firstDepth;
            return (
              <li key={run.id}>
                <Link
                  href={`/app/history/${run.id}`}
                  className="block px-5 py-5 transition-colors duration-130 hover:bg-raised"
                >
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="text-xl font-medium text-ink">{run.topic}</span>
                    <span className="text-sm text-ink-3">{formatDate(locale, run.createdAt)}</span>
                    <span className="ml-auto text-sm text-ink-3">{t.history.attempts(run.attempts)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 tabular-nums text-ink-2">
                    <span>{t.history.coverage(run.lastCoverage)}</span>
                    <span>
                      {t.history.depth(run.lastDepth)}
                      {run.attempts > 1 && (
                        <span className={gain > 0 ? "text-ok" : gain < 0 ? "text-bad" : ""}>
                          {" "}
                          ({gain > 0 ? "+" : ""}
                          {gain})
                        </span>
                      )}
                    </span>
                    <span>{t.history.gapsOpen(run.openGaps)}</span>
                    {run.closedGaps > 0 && (
                      <span className="text-ok">{t.history.gapsClosed(run.closedGaps)}</span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
