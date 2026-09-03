import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { getStats, listRuns } from "@/lib/db";
import { formatDate, plural } from "@/lib/plural";
import { PRESET_TOPICS } from "@/lib/store";
import { Stat } from "@/components/Stat";
import { GAP_META } from "@/lib/types";

export default async function DashboardPage() {
  const user = (await currentUser())!;
  const stats = getStats(user.id);
  const runs = listRuns(user.id, 5);
  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-10 py-10">
      <header>
        <p className="label">Overview</p>
        <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">
          {stats.runs === 0 ? `Welcome, ${firstName}.` : `Back again, ${firstName}.`}
        </h1>
        <p className="mt-4 max-w-xl leading-relaxed text-ink-2">
          {stats.runs === 0
            ? "Nothing diagnosed yet. Pick a topic, explain it from memory, and see which parts of the mechanism you were only recognising."
            : stats.dueCards > 0
              ? `${stats.dueCards} ${plural(stats.dueCards, "card")} are due for review, and every one of them came from a gap you actually had.`
              : "Nothing due right now. A good moment to take a topic you have been avoiding."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/app/practice" className="btn btn-primary">
            Start a session
          </Link>
          {stats.dueCards > 0 && (
            <Link href="/app/cards" className="btn btn-ghost">
              Review {stats.dueCards} {plural(stats.dueCards, "card")}
            </Link>
          )}
        </div>
      </header>

      <div className="ruler" />

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="label">
          Your record
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Sessions"
            value={stats.runs}
            note={`${stats.attempts} ${plural(stats.attempts, "explanation")} written`}
          />
          <Stat
            label="Gaps closed"
            value={stats.gapsClosed}
            note="Confirmed on a second attempt, not self-reported"
          />
          <Stat
            label="Avg depth gain"
            value={stats.avgDepthGain > 0 ? `+${stats.avgDepthGain}` : stats.avgDepthGain}
            unit="%"
            note="Mechanism depth, first attempt to last"
          />
          <Stat
            label="Cards in deck"
            value={stats.cards}
            note={`${stats.dueCards} due now`}
          />
        </div>

        {stats.topGapType && (
          <p className="mt-4 border-l-2 border-warn bg-warn-bg px-4 py-3 text-sm leading-relaxed text-ink">
            <span className="label mr-2 text-warn">Your pattern</span>
            Most of your cards come from{" "}
            <strong className="font-medium">
              {GAP_META[stats.topGapType].label.toLowerCase()}
            </strong>
            . {GAP_META[stats.topGapType].blurb}
          </p>
        )}
      </section>

      <section aria-labelledby="recent-heading">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="recent-heading" className="text-2xl leading-tight">
            Recent sessions
          </h2>
          {runs.length > 0 && (
            <Link href="/app/history" className="label hover:text-ink">
              All history →
            </Link>
          )}
        </div>

        {runs.length === 0 ? (
          <div className="panel mt-4 p-6">
            <p className="text-sm leading-relaxed text-ink-2">
              Sessions appear here once you have explained something. Four curated topics
              are ready to go:
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {PRESET_TOPICS.map((preset) => (
                <li key={preset.id}>
                  <Link
                    href={`/app/practice?topic=${encodeURIComponent(preset.topic)}`}
                    className="btn btn-ghost px-3 py-1.5 text-xs"
                  >
                    {preset.topic}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-rule border border-rule bg-surface">
            {runs.map((run) => (
              <li key={run.id}>
                <Link
                  href={`/app/history/${run.id}`}
                  className="flex flex-wrap items-baseline gap-x-5 gap-y-1 px-5 py-4 transition-colors duration-130 hover:bg-raised"
                >
                  <span className="font-display text-lg text-ink">{run.topic}</span>
                  <span className="label">{formatDate(run.createdAt)}</span>
                  <span className="label ml-auto tabular-nums">
                    coverage {run.lastCoverage}% · depth {run.lastDepth}% ·{" "}
                    {run.openGaps} {plural(run.openGaps, "gap")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
