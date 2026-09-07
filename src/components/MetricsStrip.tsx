function Meter({
  label,
  hint,
  value,
  tone,
}: {
  label: string;
  hint: string;
  value: number;
  tone: "accent" | "warn";
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.9375rem] font-medium text-ink">{label}</span>
        <span className="display text-4xl tabular-nums text-ink">
          {value}
          <span className="text-2xl text-ink-3">%</span>
        </span>
      </div>
      <div
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-sunken"
      >
        <div
          className={`h-full rounded-full ${tone === "warn" ? "bg-warn" : "bg-accent"}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="mt-2.5 text-sm leading-normal text-ink-3">{hint}</p>
    </div>
  );
}

export interface MetricsStripLabels {
  conceptCoverage: string;
  conceptCoverageHint: string;
  reasoningDepth: string;
  reasoningDepthHint: string;
  illusionHeading: (spread: number) => string;
  illusionBody: string;
  gapsFound: (count: number) => string;
  analysedIn: (seconds: string) => string;
}

interface Props {
  coverage: number;
  depth: number;
  elapsedMs?: number;
  gapCount: number;
  compact?: boolean;
  labels: MetricsStripLabels;
  formatSeconds: (ms: number) => string;
}

/** Fully controlled by its caller's strings — used from both the always-English
 * landing page and the localized app, so it carries no i18n dependency itself. */
export function MetricsStrip({
  coverage,
  depth,
  elapsedMs,
  gapCount,
  compact,
  labels,
  formatSeconds,
}: Props) {
  const spread = coverage - depth;
  // The illusion is the divergence: the map was touched broadly while the
  // mechanism stayed thin. At a decent depth the same spread diagnoses nothing.
  const illusion = coverage >= 45 && depth < 55 && spread >= 20;

  return (
    <div className={compact ? "" : "panel p-5 sm:p-6"}>
      <div className="grid gap-7 sm:grid-cols-2">
        <Meter
          label={labels.conceptCoverage}
          hint={labels.conceptCoverageHint}
          value={coverage}
          tone="accent"
        />
        <Meter
          label={labels.reasoningDepth}
          hint={labels.reasoningDepthHint}
          value={depth}
          tone={illusion ? "warn" : "accent"}
        />
      </div>

      {illusion && (
        <div className="mt-6 rounded-2xl border border-warn/25 bg-warn-bg p-4">
          <p className="text-[0.9375rem] font-medium text-ink">{labels.illusionHeading(spread)}</p>
          <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink-2">{labels.illusionBody}</p>
        </div>
      )}

      <p className="mt-6 flex flex-wrap gap-x-6 gap-y-1 border-t border-rule pt-4 text-sm tabular-nums text-ink-3">
        <span>{labels.gapsFound(gapCount)}</span>
        {elapsedMs !== undefined && <span>{labels.analysedIn(formatSeconds(elapsedMs))}</span>}
      </p>
    </div>
  );
}
