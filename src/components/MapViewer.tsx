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

      <ol className="divide-y divide-rule overflow-hidden rounded-2xl border border-rule bg-surface shadow-sm">
        {map.nodes.map((node, index) => (
          <li key={node.id} id={node.id} className="p-5 sm:p-7">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="code text-ink-3">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="display text-2xl">{node.label}</h3>
              <span className="ml-auto text-sm text-ink-3">{node.tier}</span>
            </div>
            <p className="prose-measure mt-2 leading-relaxed text-ink-2">{node.definition}</p>

            <p className="label mt-5">What someone who understands would say</p>
            <p className="prose-measure mt-1 text-[1.0625rem] leading-relaxed text-ink">
              {node.mechanism}
            </p>

            <p className="label mt-5 text-warn">The usual wrong model</p>
            <p className="prose-measure mt-1 leading-relaxed text-ink-2">{node.misconception}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
