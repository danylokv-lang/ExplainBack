import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { getStats, listRuns } from "@/lib/db";
import { dictionary, formatDate, getLocale } from "@/lib/i18n";
import { PRESET_TOPICS } from "@/lib/store";
import { Stat } from "@/components/Stat";
import { CheckCircleIcon, LayersIcon, PencilIcon, TrendingUpIcon } from "@/components/icons";

export default async function DashboardPage() {
  const user = (await currentUser())!;
  const locale = await getLocale();
  const t = dictionary(locale);
  const stats = await getStats(user.id);
  const runs = await listRuns(user.id, 5);
  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-12 py-12">
      <header>
        <p className="label">{t.dashboard.eyebrow}</p>
        <h1 className="display mt-2 text-4xl sm:text-5xl">
          {stats.runs === 0 ? t.dashboard.welcome(firstName) : t.dashboard.backAgain(firstName)}
        </h1>
        <p className="prose-measure mt-4 text-lg leading-relaxed text-ink-2">
          {stats.runs === 0
            ? t.dashboard.emptyBody
            : stats.dueCards > 0
              ? t.dashboard.dueBody(stats.dueCards)
              : t.dashboard.noDueBody}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/app/practice" className="btn btn-primary">
            {t.dashboard.startSession}
          </Link>
          {stats.dueCards > 0 && (
            <Link href="/app/cards" className="btn btn-ghost">
              {t.dashboard.reviewCards(stats.dueCards)}
            </Link>
          )}
        </div>
      </header>

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="display text-2xl">
          {t.dashboard.yourRecord}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label={t.dashboard.statSessions}
            value={stats.runs}
            note={t.dashboard.statSessionsNote(stats.attempts)}
            icon={PencilIcon}
            tone="accent"
          />
          <Stat
            label={t.dashboard.statGapsClosed}
            value={stats.gapsClosed}
            note={t.dashboard.statGapsClosedNote}
            icon={CheckCircleIcon}
            tone="ok"
          />
          <Stat
            label={t.dashboard.statAvgGain}
            value={stats.avgDepthGain > 0 ? `+${stats.avgDepthGain}` : stats.avgDepthGain}
            unit="%"
            note={t.dashboard.statAvgGainNote}
            icon={TrendingUpIcon}
            tone="warn"
          />
          <Stat
            label={t.dashboard.statCardsInDeck}
            value={stats.cards}
            note={t.dashboard.statCardsInDeckNote(stats.dueCards)}
            icon={LayersIcon}
            tone="void"
          />
        </div>

        {stats.topGapType && (
          <div className="mt-5 rounded-2xl border border-warn/25 bg-warn-bg p-5">
            <p className="font-medium text-ink">
              {t.dashboard.patternPrefix} {t.gapTypes[stats.topGapType].label.toLowerCase()}
            </p>
            <p className="prose-measure mt-1 leading-relaxed text-ink-2">
              {t.gapTypes[stats.topGapType].blurb} {t.dashboard.patternSuffix}
            </p>
          </div>
        )}
      </section>

      <section aria-labelledby="recent-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="recent-heading" className="display text-2xl">
            {t.dashboard.recentSessions}
          </h2>
          {runs.length > 0 && (
            <Link href="/app/history" className="text-[0.9375rem] text-ink-2 hover:text-ink">
              {t.dashboard.allHistory}
            </Link>
          )}
        </div>

        {runs.length === 0 ? (
          <div className="panel mt-5 p-6 sm:p-7">
            <p className="prose-measure leading-relaxed text-ink-2">{t.dashboard.emptyRecentIntro}</p>
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
                  <span className="text-sm text-ink-3">{formatDate(locale, run.createdAt)}</span>
                  <span className="ml-auto text-sm tabular-nums text-ink-2">
                    {run.lastCoverage}% {t.dashboard.coverage} · {run.lastDepth}% {t.dashboard.depth} ·{" "}
                    {t.dashboard.gapsOpen(run.openGaps)}
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
