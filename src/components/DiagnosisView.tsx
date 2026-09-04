"use client";

import { useState } from "react";
import Link from "next/link";
import { ConceptGraph } from "./ConceptGraph";
import { GapList } from "./GapList";
import { MetricsStrip } from "./MetricsStrip";
import { ProgressCompare } from "./ProgressCompare";
import { RepairLesson } from "./RepairLesson";
import { getStoredLanguage } from "@/lib/language-client";
import type { Attempt, ConceptMap, NodeStatusKind } from "@/lib/types";
import { STATUS_META } from "@/lib/types";

const LEGEND: { status: NodeStatusKind; swatch: string; note: string }[] = [
  { status: "explained", swatch: "bg-ok-bg border-ok", note: "named, with the mechanism" },
  { status: "shallow", swatch: "bg-warn-bg border-warn", note: "named, mechanism missing" },
  { status: "wrong", swatch: "bg-bad-bg border-bad", note: "stated incorrectly" },
  { status: "missing", swatch: "bg-transparent border-void border-dashed", note: "never mentioned" },
];

interface Props {
  map: ConceptMap;
  attempts: Attempt[];
  runId: number | null;
  onRetry?: () => void;
  onReset?: () => void;
  readOnly?: boolean;
}

export function DiagnosisView({ map, attempts, runId, onRetry, onReset, readOnly }: Props) {
  const [activeGapId, setActiveGapId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [cardState, setCardState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [cardMessage, setCardMessage] = useState("");

  const current = attempts[attempts.length - 1];
  const first = attempts[0];
  const { diagnosis } = current;
  const activeGap = diagnosis.gaps.find((gap) => gap.id === activeGapId) ?? null;
  const selectedNode = map.nodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedStatus = diagnosis.nodeStatuses.find((s) => s.nodeId === selectedNodeId);

  async function generateCards() {
    if (!runId) return;
    setCardState("working");
    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, language: getStoredLanguage() }),
      });
      const data = (await response.json()) as { created?: number; error?: string };
      if (!response.ok) {
        setCardState("error");
        setCardMessage(data.error ?? "Could not generate study cards. Try again in a moment.");
        return;
      }
      setCardState("done");
      setCardMessage(`${data.created} cards added to your deck.`);
    } catch {
      setCardState("error");
      setCardMessage("Could not reach the server. Check your connection and try again.");
    }
  }

  return (
    <div className="space-y-12 py-12">
      <header>
        <p className="label">Step 2 — diagnosis · attempt {current.index}</p>
        <h1 className="display mt-2 max-w-4xl text-4xl sm:text-5xl">{diagnosis.verdict}</h1>
      </header>

      <MetricsStrip
        coverage={diagnosis.coverage}
        depth={diagnosis.depth}
        elapsedMs={current.elapsedMs}
        gapCount={diagnosis.gaps.length}
      />

      {attempts.length > 1 && <ProgressCompare before={first} after={current} />}

      <section aria-labelledby="gaps-heading">
        <h2 id="gaps-heading" className="display text-3xl">
          Where It Stops Holding
        </h2>
        <p className="prose-measure mt-3 leading-relaxed text-ink-2">
          Every gap quotes your own words. Select one to light up the concepts it breaks on
          the map below.
        </p>
        <div className="mt-6">
          <GapList gaps={diagnosis.gaps} activeGapId={activeGapId} onSelect={setActiveGapId} />
        </div>
      </section>

      <section aria-labelledby="graph-heading" className="panel p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="graph-heading" className="display text-2xl">
            The Reference Map
          </h2>
          <p className="text-sm text-ink-3">{map.source === "preset" ? "Curated" : "Generated"}</p>
        </div>
        <p className="prose-measure mt-2 leading-relaxed text-ink-2">
          This is what your explanation was measured against. Click a concept to see what
          someone who understands it would have said.
        </p>

        <ul className="mt-5 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
          {LEGEND.map(({ status, swatch, note }) => (
            <li key={status} className="flex items-baseline gap-2.5 text-sm">
              <span
                aria-hidden="true"
                className={`inline-block h-3 w-3 shrink-0 translate-y-0.5 border ${swatch}`}
              />
              <span>
                <span className="font-medium text-ink">{STATUS_META[status].label}</span>
                <span className="text-ink-3"> — {note}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <ConceptGraph
            map={map}
            statuses={diagnosis.nodeStatuses}
            activeGap={activeGap}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
        </div>

        {selectedNode && (
          <div className="anim-rise mt-6 border-t border-rule pt-6" aria-live="polite">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="display text-2xl">{selectedNode.label}</h3>
              <span className="text-sm text-ink-3">
                {selectedStatus ? STATUS_META[selectedStatus.status].label : "—"}
              </span>
            </div>
            <p className="prose-measure mt-2 leading-relaxed text-ink-2">
              {selectedNode.definition}
            </p>

            <p className="label mt-5">What should have been said</p>
            <p className="prose-measure mt-1 text-[1.0625rem] leading-relaxed text-ink">
              {selectedNode.mechanism}
            </p>

            {selectedStatus?.evidence && (
              <>
                <p className="label mt-5">What you actually wrote</p>
                <p className="prose-measure mt-1 rounded-xl bg-sunken px-3.5 py-2.5 leading-relaxed text-ink-2">
                  &ldquo;{selectedStatus.evidence}&rdquo;
                </p>
              </>
            )}

            <p className="label mt-5 text-warn">The usual wrong model</p>
            <p className="prose-measure mt-1 leading-relaxed text-ink-2">
              {selectedNode.misconception}
            </p>

            <button
              type="button"
              className="btn btn-ghost mt-5 px-3.5 py-2 text-sm"
              onClick={() => setSelectedNodeId(null)}
            >
              Close
            </button>
          </div>
        )}
      </section>

      <RepairLesson questions={diagnosis.repair} gaps={diagnosis.gaps} />

      <section className={`grid gap-5 ${readOnly ? "" : "lg:grid-cols-2"}`}>
        {!readOnly && onRetry && (
          <div className="panel flex flex-col justify-between p-6">
            <div>
              <h2 className="display text-2xl">Close the Loop</h2>
              <p className="mt-2 leading-relaxed text-ink-2">
                Explain the same topic again with the repair questions in mind. We score it
                against attempt {first.index}.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className="btn btn-primary" onClick={onRetry}>
                Try Explaining Again
              </button>
              {onReset && (
                <button type="button" className="btn btn-ghost" onClick={onReset}>
                  Another Topic
                </button>
              )}
            </div>
          </div>
        )}

        <div className="panel flex flex-col justify-between p-6">
          <div>
            <h2 className="display text-2xl">Turn These Gaps Into Cards</h2>
            <p className="prose-measure mt-2 leading-relaxed text-ink-2">
              One card per gap, each written so a memorised definition cannot answer it, then
              scheduled for review over the coming weeks.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={generateCards}
              disabled={!runId || cardState === "working" || cardState === "done"}
            >
              {cardState === "working"
                ? "Writing Cards…"
                : cardState === "done"
                  ? "Cards Created"
                  : "Generate Study Cards"}
            </button>
            {cardState === "done" && (
              <Link href="/app/cards" className="btn btn-ghost">
                Review Now
              </Link>
            )}
            {cardMessage && (
              <p
                role="status"
                className={`text-[0.9375rem] ${cardState === "error" ? "text-bad" : "text-ink-2"}`}
              >
                {cardMessage}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
