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
    <div className="space-y-8 py-10">
      <header>
        <p className="label">History</p>
        <h1 className="mt-3 text-4xl leading-tight">Everything you have explained</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ink-2">
          Each session keeps your original wording alongside the diagnosis, so you can see
          what you actually wrote rather than what you remember writing.
        </p>
      </header>

      {runs.length === 0 ? (
        <div className="panel p-6">
          <p className="text-sm text-ink-2">No sessions yet.</p>
          <Link href="/app/practice" className="btn btn-primary mt-4">
            Start your first
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-rule border border-rule bg-surface">
          {runs.map((run) => {
            const gain = run.lastDepth - run.firstDepth;
            return (
              <li key={run.id}>
                <Link
                  href={`/app/history/${run.id}`}
                  className="block px-5 py-4 transition-colors duration-130 hover:bg-raised"
                >
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="font-display text-xl text-ink">{run.topic}</span>
                    <span className="label">{formatDate(run.createdAt)}</span>
                    <span className="label ml-auto">
                      {run.attempts} {plural(run.attempts, "attempt")}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm tabular-nums text-ink-2">
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
