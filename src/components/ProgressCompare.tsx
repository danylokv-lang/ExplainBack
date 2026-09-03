"use client";

import { plural } from "@/lib/plural";
import type { Attempt } from "@/lib/types";
import { GAP_META } from "@/lib/types";

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
      <p className="mt-1 flex items-baseline gap-2 font-display text-3xl tabular-nums text-ink">
        <span className="text-ink-3">{from}%</span>
        <span aria-hidden="true" className="text-lg text-ink-3">
          →
        </span>
        <span>{to}%</span>
        <span className={`font-sans text-sm ${tone}`}>
          {delta > 0 ? "+" : ""}
          {delta}
        </span>
      </p>
    </div>
  );
}

export function ProgressCompare({ before, after }: Props) {
  const resolvedIds = new Set(after.diagnosis.resolvedGapIds);
  const resolved = before.diagnosis.gaps.filter((gap) => resolvedIds.has(gap.id));
  const open = before.diagnosis.gaps.filter((gap) => !resolvedIds.has(gap.id));
  const total = before.diagnosis.gaps.length;

  return (
    <section
      aria-labelledby="compare-heading"
      className="panel border-l-2 border-l-accent p-5 sm:p-6"
    >
      <p className="label">Attempt {before.index} → attempt {after.index}</p>
      <h2 id="compare-heading" className="mt-2 text-3xl leading-tight">
        {total === 0
          ? "Attempt comparison"
          : `${resolved.length} of ${total} ${plural(total, "gap")} closed`}
      </h2>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Delta label="Map coverage" from={before.diagnosis.coverage} to={after.diagnosis.coverage} />
        <Delta label="Mechanism depth" from={before.diagnosis.depth} to={after.diagnosis.depth} />
      </div>

      {total > 0 && (
        <ul className="mt-6 space-y-2 border-t border-rule pt-4">
          {resolved.map((gap) => (
            <li key={gap.id} className="flex items-baseline gap-3 text-sm">
              <span aria-hidden="true" className="text-ok">
                ✓
              </span>
              <span className="text-ink-3 line-through">{gap.title}</span>
              <span className="label ml-auto shrink-0">{GAP_META[gap.type].code}</span>
            </li>
          ))}
          {open.map((gap) => (
            <li key={gap.id} className="flex items-baseline gap-3 text-sm">
              <span aria-hidden="true" className="text-ink-3">
                ○
              </span>
              <span className="text-ink">{gap.title}</span>
              <span className="label ml-auto shrink-0">{GAP_META[gap.type].code}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
