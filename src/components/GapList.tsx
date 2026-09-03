"use client";

import type { Gap, Severity } from "@/lib/types";
import { GAP_META } from "@/lib/types";

const SEVERITY: Record<Severity, { label: string; chip: string; rule: string }> = {
  high: { label: "critical", chip: "text-bad border-bad/40 bg-bad-bg", rule: "border-l-bad" },
  medium: { label: "material", chip: "text-warn border-warn/40 bg-warn-bg", rule: "border-l-warn" },
  low: { label: "minor", chip: "text-void border-void/40 bg-void-bg", rule: "border-l-void" },
};

interface Props {
  gaps: Gap[];
  activeGapId: string | null;
  onSelect: (gapId: string | null) => void;
  columns?: 1 | 2;
}

export function GapList({ gaps, activeGapId, onSelect, columns = 2 }: Props) {
  if (gaps.length === 0) {
    return (
      <div className="panel border-l-2 border-l-ok p-5">
        <p className="label text-ok">No gaps found</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          The mechanism holds at every node of the map. Take a harder topic — or explain
          this one again without using a single technical term.
        </p>
      </div>
    );
  }

  return (
    <ul className={columns === 2 ? "grid gap-3 lg:grid-cols-2" : "grid gap-3"}>
      {gaps.map((gap) => {
        const meta = GAP_META[gap.type];
        const severity = SEVERITY[gap.severity];
        const isActive = activeGapId === gap.id;

        return (
          <li key={gap.id} className="flex">
            <button
              type="button"
              onClick={() => onSelect(isActive ? null : gap.id)}
              aria-pressed={isActive}
              className={`panel block w-full border-l-2 p-4 text-left transition-colors duration-130 ${severity.rule} ${
                isActive
                  ? "border-y-rule-2 border-r-rule-2 bg-raised"
                  : "hover:border-y-rule-2 hover:border-r-rule-2"
              }`}
            >
              <span className="flex flex-wrap items-center gap-2">
                <span
                  className={`border px-1.5 py-0.5 font-mono text-[0.625rem] tracking-[0.12em] ${severity.chip}`}
                >
                  {meta.code}
                </span>
                <span className="label">{meta.label}</span>
                <span className="label ml-auto">{severity.label}</span>
              </span>

              <span className="mt-2.5 block font-medium leading-snug text-ink">
                {gap.title}
              </span>

              {gap.evidence && (
                <span className="mt-3 block border-l border-rule-2 pl-3 font-display text-[0.9375rem] italic leading-relaxed text-ink-2">
                  {gap.evidence}
                </span>
              )}

              <span className="mt-3 block text-sm leading-relaxed text-ink-2">{gap.why}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
