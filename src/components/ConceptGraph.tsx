"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { edgeKey, edgePath, layoutGraph, LINE_H } from "@/lib/layout";
import type { ConceptMap, Gap, NodeStatus, NodeStatusKind } from "@/lib/types";
import { STATUS_META } from "@/lib/types";

const NODE_STYLE: Record<
  NodeStatusKind,
  { fill: string; stroke: string; text: string; dash?: string; width: number }
> = {
  explained: {
    fill: "var(--color-ok-bg)",
    stroke: "var(--color-ok)",
    text: "var(--color-ink)",
    width: 1.5,
  },
  shallow: {
    fill: "var(--color-warn-bg)",
    stroke: "var(--color-warn)",
    text: "var(--color-ink)",
    width: 1.5,
  },
  wrong: {
    fill: "var(--color-bad-bg)",
    stroke: "var(--color-bad)",
    text: "var(--color-ink)",
    width: 1.5,
  },
  missing: {
    fill: "transparent",
    stroke: "var(--color-void)",
    text: "var(--color-ink-3)",
    dash: "5 4",
    width: 1.25,
  },
};

/** Relation type is encoded in the stroke pattern; the legend sits below. */
const RELATION_DASH: Record<string, string | undefined> = {
  causes: undefined,
  produces: "7 4",
  requires: "1.5 4",
  enables: "10 4 2 4",
};

/** Reference view: no diagnosis attached, so nothing is coloured. */
const NEUTRAL_STYLE = {
  fill: "var(--color-raised)",
  stroke: "var(--color-rule-2)",
  text: "var(--color-ink)",
  width: 1.25,
} as const;

interface Props {
  map: ConceptMap;
  statuses: NodeStatus[];
  activeGap: Gap | null;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  /** Draw the map on its own, with no diagnosis colouring */
  neutral?: boolean;
}

export function ConceptGraph({
  map,
  statuses,
  activeGap,
  selectedNodeId,
  onSelectNode,
  neutral,
}: Props) {
  const graph = useMemo(() => layoutGraph(map.nodes, map.edges), [map]);
  const statusById = useMemo(
    () => new Map(statuses.map((s) => [s.nodeId, s.status])),
    [statuses],
  );
  const placedById = useMemo(
    () => new Map(graph.nodes.map((p) => [p.node.id, p])),
    [graph],
  );

  // The graph fits the panel width but stops shrinking at a floor;
  // below that it scrolls horizontally instead of becoming unreadable.
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () =>
      setScale(Math.min(1, Math.max(0.62, frame.clientWidth / graph.width)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [graph.width]);

  const flaggedNodes = new Set(activeGap?.nodeIds ?? []);
  const flaggedEdge = activeGap?.edge ? edgeKey(activeGap.edge) : null;
  const flaggedEdgeInfo = flaggedEdge
    ? (map.edges.find((edge) => edgeKey(edge) === flaggedEdge) ?? null)
    : null;

  return (
    <figure className="m-0">
      <div ref={frameRef} className="overflow-x-auto overscroll-x-contain">
        <svg
          width={graph.width * scale}
          height={graph.height * scale}
          viewBox={`0 0 ${graph.width} ${graph.height}`}
          role="img"
          aria-label={`Concept map for ${map.topic}, with the diagnosed state of every concept`}
          className="block"
        >
          <defs>
            {[
              ["arrow-ink", "var(--color-ink-3)"],
              ["arrow-void", "var(--color-void)"],
              ["arrow-bad", "var(--color-bad)"],
            ].map(([id, color]) => (
              <marker
                key={id}
                id={id}
                viewBox="0 0 8 8"
                refX="7"
                refY="4"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 8 4 L 0 7 z" fill={color} />
              </marker>
            ))}
          </defs>

          {map.edges.map((edge) => {
            const a = placedById.get(edge.from);
            const b = placedById.get(edge.to);
            if (!a || !b) return null;

            const key = edgeKey(edge);
            const back = graph.backEdges.has(key);
            const isFlagged = key === flaggedEdge;
            const broken =
              !neutral &&
              (statusById.get(edge.from) === "missing" ||
              statusById.get(edge.to) === "missing" ||
              statusById.get(edge.from) === "wrong" ||
                statusById.get(edge.to) === "wrong");

            const color = isFlagged
              ? "var(--color-bad)"
              : broken
                ? "var(--color-void)"
                : "var(--color-ink-3)";
            const marker = isFlagged ? "arrow-bad" : broken ? "arrow-void" : "arrow-ink";
            const d = edgePath(a, b, back);

            return (
              <g key={key}>
                <path
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={isFlagged ? 2.25 : 1.25}
                  strokeDasharray={RELATION_DASH[edge.relation]}
                  strokeOpacity={isFlagged ? 1 : broken ? 0.55 : 0.75}
                  markerEnd={`url(#${marker})`}
                >
                  <title>{`${nodeLabel(map, edge.from)} → ${nodeLabel(map, edge.to)}: ${edge.label}`}</title>
                </path>
              </g>
            );
          })}

          {graph.nodes.map((placed) => {
            const status = statusById.get(placed.node.id) ?? "missing";
            const style = neutral
              ? { ...NEUTRAL_STYLE, dash: undefined as string | undefined }
              : NODE_STYLE[status];
            const isFlagged = flaggedNodes.has(placed.node.id);
            const isSelected = selectedNodeId === placed.node.id;

            return (
              <g
                key={placed.node.id}
                role="button"
                tabIndex={0}
                aria-label={
                  neutral
                    ? placed.node.label
                    : `${placed.node.label}: ${STATUS_META[status].label}`
                }
                aria-pressed={isSelected}
                className="cursor-pointer"
                onClick={() => onSelectNode(isSelected ? null : placed.node.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectNode(isSelected ? null : placed.node.id);
                  }
                }}
              >
                {(isFlagged || isSelected) && (
                  <rect
                    x={placed.x - 5}
                    y={placed.y - 5}
                    width={placed.w + 10}
                    height={placed.h + 10}
                    fill="none"
                    stroke={isFlagged ? "var(--color-bad)" : "var(--color-accent)"}
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                )}
                <rect
                  x={placed.x}
                  y={placed.y}
                  width={placed.w}
                  height={placed.h}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={style.width}
                  strokeDasharray={style.dash}
                />
                <rect
                  x={placed.x}
                  y={placed.y}
                  width={3}
                  height={placed.h}
                  fill={style.stroke}
                  opacity={status === "missing" ? 0.4 : 1}
                />
                {placed.lines.map((line, i) => (
                  <text
                    key={i}
                    x={placed.x + placed.w / 2}
                    y={placed.y + 22 + i * LINE_H}
                    textAnchor="middle"
                    fill={style.text}
                    fontSize="14.5"
                    fontFamily="var(--font-sans)"
                    fontWeight={500}
                  >
                    {line}
                  </text>
                ))}
                {!neutral && (
                  <text
                    x={placed.x + placed.w / 2}
                    y={placed.y + placed.h - 10}
                    textAnchor="middle"
                    fill={style.stroke}
                    fontSize="10.5"
                    letterSpacing="0.12em"
                    fontFamily="var(--font-mono)"
                  >
                    {STATUS_META[status].label.toUpperCase()}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {flaggedEdgeInfo && (
        <p className="mt-4 border-l-2 border-bad pl-3 text-sm leading-relaxed text-ink-2">
          <span className="label mr-2 text-bad">Link</span>
          {nodeLabel(map, flaggedEdgeInfo.from)} → {nodeLabel(map, flaggedEdgeInfo.to)}:{" "}
          {flaggedEdgeInfo.label}
        </p>
      )}

      <figcaption className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-rule pt-3">
        <span className="label">Link</span>
        {[
          ["causes", "brings about"],
          ["produces", "yields"],
          ["requires", "impossible without"],
          ["enables", "makes possible"],
        ].map(([relation, label]) => (
          <span key={relation} className="flex items-center gap-2 text-xs text-ink-2">
            <svg width="26" height="8" aria-hidden="true">
              <line
                x1="0"
                y1="4"
                x2="26"
                y2="4"
                stroke="var(--color-ink-3)"
                strokeWidth="1.25"
                strokeDasharray={RELATION_DASH[relation]}
              />
            </svg>
            {label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}


function nodeLabel(map: ConceptMap, id: string): string {
  return map.nodes.find((n) => n.id === id)?.label ?? id;
}
