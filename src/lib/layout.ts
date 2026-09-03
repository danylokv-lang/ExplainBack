import type { ConceptEdge, ConceptNode } from "./types";

export const NODE_W = 176;
export const LINE_H = 16;
export const NODE_PAD_Y = 28;
export const COL_GAP = 88;
export const ROW_GAP = 26;
export const MARGIN = 24;

export interface PlacedNode {
  node: ConceptNode;
  /** Wrapped label lines — layout and render must agree on them */
  lines: string[];
  x: number;
  y: number;
  w: number;
  h: number;
  layer: number;
}

export interface GraphLayout {
  nodes: PlacedNode[];
  /** Edges pointing back across layers; drawn as a separate arc */
  backEdges: Set<string>;
  width: number;
  height: number;
}

export function edgeKey(e: { from: string; to: string }): string {
  return `${e.from}->${e.to}`;
}

/** Rough word wrapping to the fixed node width. */
function wrap(label: string, maxChars = 20): string[] {
  const words = label.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

/**
 * Left-to-right layered layout: a node's layer is its longest path from a root.
 * Maps are allowed to contain cycles (current → heating → resistance → current
 * in Ohm's law), so back edges are removed by a depth-first pass first.
 */
export function layoutGraph(nodes: ConceptNode[], edges: ConceptEdge[]): GraphLayout {
  const ids = nodes.map((n) => n.id);
  const known = new Set(ids);
  const clean = edges.filter((e) => known.has(e.from) && known.has(e.to) && e.from !== e.to);

  const out = new Map<string, string[]>(ids.map((id) => [id, []]));
  for (const e of clean) out.get(e.from)!.push(e.to);

  // 1. Strip back edges to leave an acyclic skeleton.
  const backEdges = new Set<string>();
  const state = new Map<string, 0 | 1 | 2>(ids.map((id) => [id, 0]));
  const visit = (id: string) => {
    state.set(id, 1);
    for (const next of out.get(id)!) {
      const s = state.get(next);
      if (s === 1) backEdges.add(`${id}->${next}`);
      else if (s === 0) visit(next);
    }
    state.set(id, 2);
  };
  for (const id of ids) if (state.get(id) === 0) visit(id);

  const dag = clean.filter((e) => !backEdges.has(edgeKey(e)));

  // 2. Layer = longest path from a node with no incoming edges (Kahn).
  const indeg = new Map<string, number>(ids.map((id) => [id, 0]));
  for (const e of dag) indeg.set(e.to, indeg.get(e.to)! + 1);
  const layer = new Map<string, number>(ids.map((id) => [id, 0]));
  const queue = ids.filter((id) => indeg.get(id) === 0);
  const dagOut = new Map<string, string[]>(ids.map((id) => [id, []]));
  for (const e of dag) dagOut.get(e.from)!.push(e.to);
  while (queue.length) {
    const id = queue.shift()!;
    for (const next of dagOut.get(id)!) {
      layer.set(next, Math.max(layer.get(next)!, layer.get(id)! + 1));
      indeg.set(next, indeg.get(next)! - 1);
      if (indeg.get(next) === 0) queue.push(next);
    }
  }

  // 3. Order within a layer by the barycentre of predecessors, two passes.
  const preds = new Map<string, string[]>(ids.map((id) => [id, []]));
  for (const e of dag) preds.get(e.to)!.push(e.from);

  const columns: string[][] = [];
  for (const id of ids) {
    const l = layer.get(id)!;
    (columns[l] ||= []).push(id);
  }
  const orderIndex = new Map<string, number>();
  columns.forEach((col) => col.forEach((id, i) => orderIndex.set(id, i)));
  for (let pass = 0; pass < 2; pass++) {
    for (let l = 1; l < columns.length; l++) {
      const col = columns[l];
      const bary = new Map<string, number>();
      for (const id of col) {
        const ps = preds.get(id)!;
        bary.set(
          id,
          ps.length
            ? ps.reduce((sum, p) => sum + (orderIndex.get(p) ?? 0), 0) / ps.length
            : (orderIndex.get(id) ?? 0),
        );
      }
      col.sort((a, b) => bary.get(a)! - bary.get(b)!);
      col.forEach((id, i) => orderIndex.set(id, i));
    }
  }

  // 4. Coordinates.
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const measured = new Map<string, { lines: string[]; h: number }>();
  for (const n of nodes) {
    const lines = wrap(n.label);
    measured.set(n.id, { lines, h: NODE_PAD_Y * 2 + lines.length * LINE_H });
  }

  const colHeights = columns.map((col) =>
    col.reduce((sum, id) => sum + measured.get(id)!.h, 0) + ROW_GAP * Math.max(col.length - 1, 0),
  );
  const contentH = Math.max(...colHeights, 1);

  const placed: PlacedNode[] = [];
  columns.forEach((col, l) => {
    let y = MARGIN + (contentH - colHeights[l]) / 2;
    for (const id of col) {
      const { lines, h } = measured.get(id)!;
      placed.push({
        node: byId.get(id)!,
        lines,
        x: MARGIN + l * (NODE_W + COL_GAP),
        y,
        w: NODE_W,
        h,
        layer: l,
      });
      y += h + ROW_GAP;
    }
  });

  return {
    nodes: placed,
    backEdges,
    width: MARGIN * 2 + columns.length * NODE_W + (columns.length - 1) * COL_GAP,
    height: contentH + MARGIN * 2,
  };
}

/**
 * The curve between two nodes. Back edges dip underneath so a cycle reads as a
 * cycle rather than as a tangle of crossing lines.
 */
export function edgePath(a: PlacedNode, b: PlacedNode, back: boolean): string {
  const ax = back ? a.x : a.x + a.w;
  const ay = a.y + a.h / 2;
  const bx = back ? b.x + b.w : b.x;
  const by = b.y + b.h / 2;

  if (back) {
    const dip = Math.max(a.y + a.h, b.y + b.h) + 44;
    return `M ${ax} ${ay} C ${ax - 56} ${dip}, ${bx + 56} ${dip}, ${bx} ${by}`;
  }
  const dx = Math.max((bx - ax) * 0.45, 28);
  return `M ${ax} ${ay} C ${ax + dx} ${ay}, ${bx - dx} ${by}, ${bx} ${by}`;
}
