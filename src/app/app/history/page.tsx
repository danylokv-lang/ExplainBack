import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { listRuns } from "@/lib/db";
import { formatDate, plural } from "@/lib/plural";

export const metadata: Metadata = { title: "History" };

export default async function HistoryPage() {
  const user = (await currentUser())!;
  const runs = listRuns(user.id);

  return (
    <div className="space-y-9 py-12">
      <header>
        <p className="label">History</p>
        <h1 className="display mt-2 text-4xl">Everything You Have Explained</h1>
        <p className="prose-measure mt-4 text-lg leading-relaxed text-ink-2">
          Each session keeps your original wording next to the diagnosis, so you can see
          what you wrote rather than what you remember writing.
        </p>
      </header>

      {runs.length === 0 ? (
        <div className="panel p-6">
          <p className="leading-relaxed text-ink-2">No sessions yet.</p>
          <Link href="/app/practice" className="btn btn-primary mt-5">
            Start Your First
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
                    <span className="text-sm text-ink-3">{formatDate(run.createdAt)}</span>
                    <span className="ml-auto text-sm text-ink-3">
                      {run.attempts} {plural(run.attempts, "attempt")}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 tabular-nums text-ink-2">
                    <span>Coverage {run.lastCoverage}%</span>
                    <span>
                      Depth {run.lastDepth}%
                      {run.attempts > 1 && (
                        <span className={gain > 0 ? "text-ok" : gain < 0 ? "text-bad" : ""}>
                          {" "}
                          ({gain > 0 ? "+" : ""}
                          {gain})
                        </span>
                      )}
                    </span>
                    <span>
                      {run.openGaps} open {plural(run.openGaps, "gap")}
                    </span>
                    {run.closedGaps > 0 && (
                      <span className="text-ok">{run.closedGaps} closed</span>
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
