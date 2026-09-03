"use client";

import { useState } from "react";
import { ConceptGraph } from "./ConceptGraph";
import type { ConceptMap } from "@/lib/types";

/** Reference view of a map: the graph plus the mechanism behind each node. */
export function MapViewer({ map }: { map: ConceptMap }) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div className="panel p-5 sm:p-6">
        <ConceptGraph
          map={map}
          statuses={[]}
          activeGap={null}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          neutral
        />
      </div>

      <ol className="divide-y divide-rule border border-rule bg-surface">
        {map.nodes.map((node, index) => (
          <li key={node.id} id={node.id} className="p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-display text-2xl leading-none tabular-nums text-ink-3">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-2xl leading-tight">{node.label}</h3>
              <span className="label ml-auto">{node.tier}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">{node.definition}</p>

            <p className="label mt-4">The mechanism</p>
            <p className="mt-1 font-display text-base leading-relaxed text-ink">
              {node.mechanism}
            </p>

            <p className="label mt-4 text-warn">The usual wrong model</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-2">{node.misconception}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
