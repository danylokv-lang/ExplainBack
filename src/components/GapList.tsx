"use client";

import { useLocale } from "./LocaleProvider";
import type { Gap, Severity } from "@/lib/types";

const SEVERITY: Record<Severity, { chip: string; rule: string }> = {
  high: { chip: "text-bad border-bad/50 bg-bad-bg", rule: "border-l-bad" },
  medium: { chip: "text-warn border-warn/50 bg-warn-bg", rule: "border-l-warn" },
  low: { chip: "text-void border-void/50 bg-void-bg", rule: "border-l-void" },
};

interface Props {
  gaps: Gap[];
  activeGapId: string | null;
  onSelect: (gapId: string | null) => void;
  columns?: 1 | 2;
}

export function GapList({ gaps, activeGapId, onSelect, columns = 2 }: Props) {
  const { t } = useLocale();

  if (gaps.length === 0) {
    return (
      <div className="panel border-l-[3px] border-l-ok p-5">
        <p className="text-[0.9375rem] font-medium text-ok">{t.diagnosis.gapsSection.noGapsHeading}</p>
        <p className="prose-measure mt-2 leading-relaxed text-ink-2">{t.diagnosis.gapsSection.noGapsBody}</p>
      </div>
    );
  }

  return (
    <ul className={columns === 2 ? "grid gap-4 lg:grid-cols-2" : "grid gap-4"}>
      {gaps.map((gap) => {
        const meta = t.gapTypes[gap.type];
        const severity = SEVERITY[gap.severity];
        const isActive = activeGapId === gap.id;

        return (
          <li key={gap.id} className="flex">
            <button
              type="button"
              onClick={() => onSelect(isActive ? null : gap.id)}
              aria-pressed={isActive}
              className={`panel block w-full border-l-[3px] p-5 text-left transition-colors duration-130 ${severity.rule} ${
                isActive
                  ? "border-y-rule-2 border-r-rule-2 bg-raised"
                  : "hover:border-y-rule-2 hover:border-r-rule-2"
              }`}
            >
              <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className={`chip ${severity.chip}`}>{meta.label}</span>
                <span className="ml-auto text-sm text-ink-3">{t.severity[gap.severity]}</span>
              </span>

              <span className="mt-3 block text-lg font-medium leading-snug text-ink">
                {gap.title}
              </span>

              {gap.evidence && (
                <span className="mt-3 block rounded-xl bg-sunken px-3.5 py-2.5 text-[0.9375rem] leading-relaxed text-ink-2">
                  &ldquo;{gap.evidence}&rdquo;
                </span>
              )}

              <span className="mt-3 block text-sm font-medium text-ink-3">
                {t.diagnosis.gapsSection.whyFlagged}
              </span>
              <span className="mt-1 block leading-relaxed text-ink-2">{gap.why}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
