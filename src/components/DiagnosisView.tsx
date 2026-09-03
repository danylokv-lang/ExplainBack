"use client";

import { useState } from "react";
import Link from "next/link";
import { ConceptGraph } from "./ConceptGraph";
import { GapList } from "./GapList";
import { MetricsStrip } from "./MetricsStrip";
import { ProgressCompare } from "./ProgressCompare";
import { RepairLesson } from "./RepairLesson";
import type { Attempt, ConceptMap, NodeStatusKind } from "@/lib/types";
import { STATUS_META } from "@/lib/types";

const LEGEND: { status: NodeStatusKind; swatch: string }[] = [
  { status: "explained", swatch: "bg-ok-bg border-ok" },
  { status: "shallow", swatch: "bg-warn-bg border-warn" },
  { status: "wrong", swatch: "bg-bad-bg border-bad" },
  { status: "missing", swatch: "bg-transparent border-void border-dashed" },
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
        body: JSON.stringify({ runId }),
      });
      const data = (await response.json()) as { created?: number; error?: string };
      if (!response.ok) {
        setCardState("error");
        setCardMessage(data.error ?? "Could not generate study cards.");
        return;
      }
      setCardState("done");
      setCardMessage(`${data.created} cards added to your deck.`);
    } catch {
      setCardState("error");
      setCardMessage("Could not reach the server.");
    }
  }

  return (
    <div className="space-y-10 py-10">
      <header>
        <p className="label">
          Step 2 — diagnosis · attempt {current.index}
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl leading-[1.15] sm:text-5xl">
          {diagnosis.verdict}
        </h1>
      </header>

      <MetricsStrip
        coverage={diagnosis.coverage}
        depth={diagnosis.depth}
        elapsedMs={current.elapsedMs}
        gapCount={diagnosis.gaps.length}
      />

      {attempts.length > 1 && <ProgressCompare before={first} after={current} />}

      <section aria-labelledby="graph-heading" className="panel p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="graph-heading" className="text-2xl leading-tight">
            The reference map
          </h2>
          <p className="label">{map.source === "preset" ? "curated" : "generated"}</p>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2">
          This is the skeleton your explanation was measured against. A node&apos;s colour is
          what happened to it in your text. Click one to see what should have been said.
        </p>

        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {LEGEND.map(({ status, swatch }) => (
            <li key={status} className="flex items-center gap-2 text-xs text-ink-2">
              <span aria-hidden="true" className={`inline-block h-3 w-3 border ${swatch}`} />
              {STATUS_META[status].label}
            </li>
          ))}
        </ul>

        <div className="mt-5">
          <ConceptGraph
            map={map}
            statuses={diagnosis.nodeStatuses}
            activeGap={activeGap}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
        </div>

        {selectedNode && (
          <div className="anim-rise mt-5 border-t border-rule pt-5" aria-live="polite">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-2xl">{selectedNode.label}</h3>
              <span className="label">
                {selectedStatus ? STATUS_META[selectedStatus.status].label : "—"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">{selectedNode.definition}</p>

            <p className="label mt-4">What should have been said</p>
            <p className="mt-1 font-display text-base leading-relaxed text-ink">
              {selectedNode.mechanism}
            </p>

            {selectedStatus?.evidence && (
              <>
                <p className="label mt-4">From your text</p>
                <p className="mt-1 border-l border-rule-2 pl-3 font-display text-sm italic leading-relaxed text-ink-2">
                  {selectedStatus.evidence}
                </p>
              </>
            )}

            <p className="label mt-4">The usual wrong model</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-2">
              {selectedNode.misconception}
            </p>

            <button
              type="button"
              className="btn btn-ghost mt-4 px-3 py-1.5 text-xs"
              onClick={() => setSelectedNodeId(null)}
            >
              Close
            </button>
          </div>
        )}
      </section>

      <section aria-labelledby="gaps-heading">
        <h2 id="gaps-heading" className="text-3xl leading-tight">
          Where it stops holding
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2">
          Every gap rests on a verbatim quote from your text. Select one and the nodes it
          concerns light up on the map.
        </p>
        <div className="mt-5">
          <GapList gaps={diagnosis.gaps} activeGapId={activeGapId} onSelect={setActiveGapId} />
        </div>
      </section>

      <RepairLesson questions={diagnosis.repair} gaps={diagnosis.gaps} />

      <div className="ruler" />

      <section className={`grid gap-6 ${readOnly ? "" : "lg:grid-cols-2"}`}>
        {!readOnly && onRetry && (
          <div className="panel flex flex-col justify-between p-5 sm:p-6">
            <div>
              <p className="label">Close the loop</p>
              <h2 className="mt-2 text-2xl leading-tight">Explain it again</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">
                Same topic, second pass, with the repair questions in mind. We compare
                against attempt {first.index}.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" className="btn btn-primary" onClick={onRetry}>
                Try explaining again
              </button>
              {onReset && (
                <button type="button" className="btn btn-ghost" onClick={onReset}>
                  Another topic
                </button>
              )}
            </div>
          </div>
        )}

        <div className="panel flex flex-col justify-between p-5 sm:p-6">
          <div>
            <p className="label">Make it stick</p>
            <h2 className="mt-2 text-2xl leading-tight">Turn these gaps into cards</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              One card per gap, each written so a memorised definition cannot answer it,
              then scheduled for review over the following weeks.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={generateCards}
              disabled={!runId || cardState === "working" || cardState === "done"}
            >
              {cardState === "working"
                ? "Writing cards…"
                : cardState === "done"
                  ? "Cards created"
                  : "Generate study cards"}
            </button>
            {cardState === "done" && (
              <Link href="/app/cards" className="btn btn-ghost">
                Review now
              </Link>
            )}
            {cardMessage && (
              <p
                role="status"
                className={`text-sm ${cardState === "error" ? "text-bad" : "text-ink-2"}`}
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
