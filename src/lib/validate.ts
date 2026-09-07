import type { ConceptEdge, ConceptMap, Diagnosis, Gap, NodeStatus } from "./types";

const RELATIONS = new Set(["causes", "requires", "produces", "enables"]);

/**
 * The model returns schema-valid JSON, but a schema cannot guarantee
 * connectivity: an edge may point at a node that was never emitted. This
 * brings the map to a state where the graph is guaranteed to draw.
 */
export function sanitizeMap(raw: unknown, topic: string): ConceptMap {
  const data = raw as { brief?: string; nodes?: ConceptMap["nodes"]; edges?: ConceptEdge[] };
  const nodes = (data.nodes ?? []).filter((node) => node && node.id && node.label);
  if (nodes.length < 3) {
    throw new Error("That map came out too thin — try phrasing the topic more specifically.");
  }
  const ids = new Set(nodes.map((node) => node.id));
  const seen = new Set<string>();
  const edges = (data.edges ?? []).filter((edge) => {
    if (!edge || !ids.has(edge.from) || !ids.has(edge.to) || edge.from === edge.to) return false;
    if (!RELATIONS.has(edge.relation)) return false;
    const key = `${edge.from}->${edge.to}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    topic,
    brief: data.brief?.trim() || `Explain "${topic}" in your own words.`,
    nodes,
    edges,
    source: "generated",
  };
}

const STATUS_WEIGHT = { explained: 1, shallow: 1, wrong: 0.5, missing: 0 } as const;

/**
 * Coverage is computed from the assigned statuses rather than taken from the
 * model's own estimate: otherwise two runs over identical text return
 * different percentages and the before/after comparison stops meaning anything.
 *
 * Shallow mentions count in full on purpose. Coverage answers "how much of the
 * map was touched at all"; the quality of that touch is what depth measures.
 * The distance between the two numbers is the illusion of understanding, made
 * into a number.
 */
export function sanitizeDiagnosis(raw: unknown, map: ConceptMap): Diagnosis {
  const data = raw as Partial<Diagnosis>;
  const ids = new Set(map.nodes.map((node) => node.id));

  const byId = new Map<string, NodeStatus>();
  for (const status of data.nodeStatuses ?? []) {
    if (status && ids.has(status.nodeId) && !byId.has(status.nodeId)) {
      byId.set(status.nodeId, {
        nodeId: status.nodeId,
        status: status.status,
        evidence: (status.evidence ?? "").trim(),
      });
    }
  }
  const nodeStatuses: NodeStatus[] = map.nodes.map(
    (node) => byId.get(node.id) ?? { nodeId: node.id, status: "missing", evidence: "" },
  );

  const coverage = Math.round(
    (nodeStatuses.reduce((sum, status) => sum + STATUS_WEIGHT[status.status], 0) /
      nodeStatuses.length) *
      100,
  );

  const gapIds = new Set<string>();
  const gaps: Gap[] = (data.gaps ?? [])
    .filter((gap): gap is Gap => Boolean(gap && gap.id && gap.type && gap.title))
    .map((gap) => ({
      ...gap,
      nodeIds: (gap.nodeIds ?? []).filter((id) => ids.has(id)),
      edge: gap.edge && ids.has(gap.edge.from) && ids.has(gap.edge.to) ? gap.edge : null,
      evidence: (gap.evidence ?? "").trim(),
    }))
    .filter((gap) => {
      if (gapIds.has(gap.id)) return false;
      gapIds.add(gap.id);
      return true;
    })
    .slice(0, 5);

  const severityRank = { high: 0, medium: 1, low: 2 } as const;
  gaps.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  const repair = (data.repair ?? [])
    .filter((question) => question && question.question)
    .map((question, index) => ({
      ...question,
      id: question.id || `q-${index + 1}`,
      gapId: gapIds.has(question.gapId) ? question.gapId : (gaps[0]?.id ?? ""),
    }))
    .slice(0, 3);

  return {
    coverage: clamp(coverage),
    depth: clamp(Number(data.depth ?? 0)),
    verdict: data.verdict?.trim() || "Diagnosis complete.",
    // Falls back to the top gap's own title rather than a generic line: a
    // named gap beats "review the material" even without a model-written
    // sentence.
    nextStep: data.nextStep?.trim() || gaps[0]?.title || "",
    nodeStatuses,
    gaps,
    repair,
    resolvedGapIds: [...new Set(data.resolvedGapIds ?? [])],
  };
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}
