"use client";

import { formatSeconds, plural } from "@/lib/plural";

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
        <span className="label">{label}</span>
        <span className="font-display text-4xl leading-none tabular-nums text-ink">
          {value}
          <span className="text-xl text-ink-3">%</span>
        </span>
      </div>
      <div
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="mt-3 h-1.5 w-full bg-sunken"
      >
        <div
          className={`h-full ${tone === "warn" ? "bg-warn" : "bg-accent"}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink-3">{hint}</p>
    </div>
  );
}

interface Props {
  coverage: number;
  depth: number;
  elapsedMs?: number;
  gapCount: number;
  compact?: boolean;
}

export function MetricsStrip({ coverage, depth, elapsedMs, gapCount, compact }: Props) {
  const spread = coverage - depth;
  // The illusion is the divergence: the map was touched broadly while the
  // mechanism stayed thin. At a decent depth the same spread diagnoses nothing.
  const illusion = coverage >= 45 && depth < 55 && spread >= 20;

  return (
    <div className={compact ? "" : "panel p-5 sm:p-6"}>
      <div className="grid gap-6 sm:grid-cols-2">
        <Meter
          label="Map coverage"
          hint="How many nodes of the reference map appeared in your text at all."
          value={coverage}
          tone="accent"
        />
        <Meter
          label="Mechanism depth"
          hint="How far the explanation rests on why it works, not on what it is called."
          value={depth}
          tone={illusion ? "warn" : "accent"}
        />
      </div>

      {illusion && (
        <p className="mt-5 border-l-2 border-warn bg-warn-bg px-4 py-3 text-sm leading-relaxed text-ink">
          <span className="label mr-2 text-warn">Spread {spread} pts</span>
          The vocabulary is there and the machinery is not. That is the illusion of
          understanding: a topic feels clear right up until you have to explain it.
        </p>
      )}

      <p className="label mt-5 flex flex-wrap gap-x-5 gap-y-1 border-t border-rule pt-3 tabular-nums">
        <span>
          {gapCount} {plural(gapCount, "gap")} found
        </span>
        {elapsedMs !== undefined && <span>Analysed in {formatSeconds(elapsedMs)}s</span>}
      </p>
    </div>
  );
}
