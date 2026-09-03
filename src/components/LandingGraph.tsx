"use client";

import { useState } from "react";
import { ConceptGraph } from "./ConceptGraph";
import type { ConceptMap, Diagnosis } from "@/lib/types";

/** The landing page shows the real component, not a picture of one. */
export function LandingGraph({
  map,
  diagnosis,
}: {
  map: ConceptMap;
  diagnosis: Diagnosis;
}) {
  const [activeGapId, setActiveGapId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const activeGap = diagnosis.gaps.find((gap) => gap.id === activeGapId) ?? null;
  const selectedNode = map.nodes.find((node) => node.id === selectedNodeId) ?? null;

  return (
    <div>
      <div className="panel p-5 sm:p-6">
        <ConceptGraph
          map={map}
          statuses={diagnosis.nodeStatuses}
          activeGap={activeGap}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
        />
        {selectedNode && (
          <div className="anim-rise mt-5 border-t border-rule pt-5">
            <p className="label">{selectedNode.label} — what should have been said</p>
            <p className="prose-measure mt-1.5 text-[1.0625rem] leading-relaxed text-ink">
              {selectedNode.mechanism}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {diagnosis.gaps.slice(0, 3).map((gap) => (
          <button
            key={gap.id}
            type="button"
            aria-pressed={activeGapId === gap.id}
            onClick={() => setActiveGapId(activeGapId === gap.id ? null : gap.id)}
            className={`border px-3.5 py-2 text-sm transition-colors duration-130 ${
              activeGapId === gap.id
                ? "border-bad bg-bad-bg text-ink"
                : "border-rule-2 text-ink-2 hover:border-ink-3 hover:text-ink"
            }`}
          >
            {gap.title}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-ink-3">Select a gap to light up the concepts it breaks.</p>
    </div>
  );
}
