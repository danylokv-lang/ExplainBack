import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { getStats, listRuns } from "@/lib/db";
import { formatDate, plural } from "@/lib/plural";
import { PRESET_TOPICS } from "@/lib/store";
import { Stat } from "@/components/Stat";
import { CheckCircleIcon, LayersIcon, PencilIcon, TrendingUpIcon } from "@/components/icons";
import { GAP_META } from "@/lib/types";

export default async function DashboardPage() {
  const user = (await currentUser())!;
  const stats = getStats(user.id);
  const runs = listRuns(user.id, 5);
  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-12 py-12">
      <header>
        <p className="label">Overview</p>
        <h1 className="display mt-2 text-4xl sm:text-5xl">
          {stats.runs === 0 ? `Welcome, ${firstName}.` : `Back again, ${firstName}.`}
        </h1>
        <p className="prose-measure mt-4 text-lg leading-relaxed text-ink-2">
          {stats.runs === 0
            ? "Nothing diagnosed yet. Pick a topic, explain it from memory, and find out which parts you were only recognising."
            : stats.dueCards > 0
              ? `${stats.dueCards} ${plural(stats.dueCards, "card")} are due for review, and every one came from a gap you actually had.`
              : "Nothing due right now. Good moment for a topic you have been avoiding."}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/app/practice" className="btn btn-primary">
            Start a Session
          </Link>
          {stats.dueCards > 0 && (
            <Link href="/app/cards" className="btn btn-ghost">
              Review {stats.dueCards} {plural(stats.dueCards, "Card")}
            </Link>
          )}
        </div>
      </header>

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="display text-2xl">
          Your Record
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Sessions"
            value={stats.runs}
            note={`${stats.attempts} ${plural(stats.attempts, "explanation")} written`}
            icon={PencilIcon}
            tone="accent"
          />
          <Stat
            label="Gaps closed"
            value={stats.gapsClosed}
            note="Confirmed on a second attempt, not self-reported"
            icon={CheckCircleIcon}
            tone="ok"
          />
          <Stat
            label="Avg depth gain"
            value={stats.avgDepthGain > 0 ? `+${stats.avgDepthGain}` : stats.avgDepthGain}
            unit="%"
            note="Mechanism depth, first attempt to last"
            icon={TrendingUpIcon}
            tone="warn"
          />
          <Stat
            label="Cards in deck"
            value={stats.cards}
            note={`${stats.dueCards} due now`}
            icon={LayersIcon}
            tone="void"
          />
        </div>

        {stats.topGapType && (
          <div className="mt-5 rounded-2xl border border-warn/25 bg-warn-bg p-5">
            <p className="font-medium text-ink">
              Your pattern: {GAP_META[stats.topGapType].label.toLowerCase()}
            </p>
            <p className="prose-measure mt-1 leading-relaxed text-ink-2">
              {GAP_META[stats.topGapType].blurb} That is where most of your cards come from.
            </p>
          </div>
        )}
      </section>

      <section aria-labelledby="recent-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="recent-heading" className="display text-2xl">
            Recent Sessions
          </h2>
          {runs.length > 0 && (
            <Link href="/app/history" className="text-[0.9375rem] text-ink-2 hover:text-ink">
              All history →
            </Link>
          )}
        </div>

        {runs.length === 0 ? (
          <div className="panel mt-5 p-6 sm:p-7">
            <p className="prose-measure leading-relaxed text-ink-2">
              Sessions show up here once you have explained something. Four topics are ready
              to go:
            </p>
            <ul className="mt-5 flex flex-wrap gap-2.5">
              {PRESET_TOPICS.map((preset) => (
                <li key={preset.id}>
                  <Link
                    href={`/app/practice?topic=${encodeURIComponent(preset.topic)}`}
                    className="btn btn-ghost px-4 py-2.5 text-sm"
                  >
                    {preset.topic}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ul className="mt-5 divide-y divide-rule overflow-hidden rounded-2xl border border-rule bg-surface shadow-sm">
            {runs.map((run) => (
              <li key={run.id}>
                <Link
                  href={`/app/history/${run.id}`}
                  className="flex flex-wrap items-baseline gap-x-5 gap-y-1 px-5 py-4 transition-colors duration-130 hover:bg-raised"
                >
                  <span className="text-lg font-medium text-ink">{run.topic}</span>
                  <span className="text-sm text-ink-3">{formatDate(run.createdAt)}</span>
                  <span className="ml-auto text-sm tabular-nums text-ink-2">
                    {run.lastCoverage}% coverage · {run.lastDepth}% depth · {run.openGaps}{" "}
                    {plural(run.openGaps, "gap")} open
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
