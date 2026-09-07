"use client";

import { useLocale } from "./LocaleProvider";
import type { Attempt } from "@/lib/types";

interface Props {
  before: Attempt;
  after: Attempt;
}

function Delta({ label, from, to }: { label: string; from: number; to: number }) {
  const delta = to - from;
  const tone = delta > 0 ? "text-ok" : delta < 0 ? "text-bad" : "text-ink-3";
  return (
    <div>
      <p className="label">{label}</p>
      <p className="mt-1 flex items-baseline gap-2 tabular-nums">
        <span className="display text-2xl text-ink-3">{from}%</span>
        <span aria-hidden="true" className="text-ink-3">
          →
        </span>
        <span className="display text-3xl text-ink">{to}%</span>
        <span className={`text-[0.9375rem] font-medium ${tone}`}>
          {delta > 0 ? "+" : ""}
          {delta}
        </span>
      </p>
    </div>
  );
}

export function ProgressCompare({ before, after }: Props) {
  const { t } = useLocale();
  const resolvedIds = new Set(after.diagnosis.resolvedGapIds);
  const resolved = before.diagnosis.gaps.filter((gap) => resolvedIds.has(gap.id));
  const open = before.diagnosis.gaps.filter((gap) => !resolvedIds.has(gap.id));
  const total = before.diagnosis.gaps.length;

  return (
    <section
      aria-labelledby="compare-heading"
      className="panel border-l-[3px] border-l-accent p-5 sm:p-6"
    >
      <p className="label">{t.diagnosis.compare.attemptArrow(before.index, after.index)}</p>
      <h2 id="compare-heading" className="display mt-2 text-3xl">
        {total === 0
          ? t.diagnosis.compare.comparisonTitle
          : t.diagnosis.compare.gapsClosedTitle(resolved.length, total)}
      </h2>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Delta
          label={t.diagnosis.compare.conceptCoverage}
          from={before.diagnosis.coverage}
          to={after.diagnosis.coverage}
        />
        <Delta
          label={t.diagnosis.compare.reasoningDepth}
          from={before.diagnosis.depth}
          to={after.diagnosis.depth}
        />
      </div>

      {total > 0 && (
        <ul className="mt-7 space-y-2.5 border-t border-rule pt-5">
          {resolved.map((gap) => (
            <li key={gap.id} className="flex items-baseline gap-3">
              <span aria-hidden="true" className="text-ok">
                ✓
              </span>
              <span className="text-ink-3 line-through">{gap.title}</span>
              <span className="ml-auto shrink-0 text-sm text-ink-3">{t.gapTypes[gap.type].label}</span>
            </li>
          ))}
          {open.map((gap) => (
            <li key={gap.id} className="flex items-baseline gap-3">
              <span aria-hidden="true" className="text-ink-3">
                ○
              </span>
              <span className="text-ink">{gap.title}</span>
              <span className="ml-auto shrink-0 text-sm text-ink-3">{t.gapTypes[gap.type].label}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
