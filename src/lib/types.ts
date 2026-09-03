/** Domain models shared by the server and the client. */

export type NodeTier = "core" | "supporting";

export interface ConceptNode {
  /** kebab-case identifier, stable within one map */
  id: string;
  label: string;
  /** One-sentence definition */
  definition: string;
  /**
   * The mechanism marker: the thing somebody who genuinely understands the
   * concept cannot help saying. This is what makes SURFACE_ONLY detectable.
   */
  mechanism: string;
  /** The faulty model students actually arrive with */
  misconception: string;
  tier: NodeTier;
}

export type EdgeRelation = "causes" | "requires" | "produces" | "enables";

export interface ConceptEdge {
  from: string;
  to: string;
  relation: EdgeRelation;
  /** Plain-language label, 2-5 words */
  label: string;
}

export interface ConceptMap {
  topic: string;
  /** One sentence: what counts as having explained this */
  brief: string;
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  source: "preset" | "generated";
}

export type GapType =
  | "MISSING_CONCEPT"
  | "WRONG_CAUSALITY"
  | "CORRELATION_AS_CAUSATION"
  | "SURFACE_ONLY"
  | "OVERGENERALIZATION";

export type Severity = "high" | "medium" | "low";

export interface Gap {
  id: string;
  type: GapType;
  severity: Severity;
  nodeIds: string[];
  /** The map edge, when the gap is about causality */
  edge: { from: string; to: string } | null;
  title: string;
  /** Verbatim quote from the learner; empty for MISSING_CONCEPT */
  evidence: string;
  /** What breaks in the mechanism, 1-2 sentences */
  why: string;
}

export type NodeStatusKind = "explained" | "shallow" | "wrong" | "missing";

export interface NodeStatus {
  nodeId: string;
  status: NodeStatusKind;
  evidence: string;
}

export interface RepairQuestion {
  id: string;
  gapId: string;
  /** Socratic prompt — leads to the answer, never states it */
  question: string;
  /** Click-to-reveal nudge, 2-3 sentences */
  hint: string;
}

export interface Diagnosis {
  /** 0-100: how much of the map was touched at all */
  coverage: number;
  /** 0-100: how far the explanation rests on mechanism rather than vocabulary */
  depth: number;
  verdict: string;
  nodeStatuses: NodeStatus[];
  gaps: Gap[];
  repair: RepairQuestion[];
  /** Second attempt only: ids of first-attempt gaps that were closed */
  resolvedGapIds: string[];
}

export interface Attempt {
  index: number;
  explanation: string;
  diagnosis: Diagnosis;
  elapsedMs: number;
}

/** A study card generated from a diagnosed gap. */
export interface StudyCard {
  id: number;
  runId: number | null;
  topic: string;
  gapType: GapType | null;
  front: string;
  back: string;
  /** The tempting wrong answer this card exists to disarm */
  trap: string;
  reps: number;
  intervalDays: number;
  ease: number;
  dueAt: string;
  lastReviewedAt: string | null;
}

export const GAP_META: Record<
  GapType,
  { label: string; code: string; blurb: string }
> = {
  MISSING_CONCEPT: {
    label: "Missing concept",
    code: "MISS",
    blurb: "A load-bearing node of the mechanism never appeared.",
  },
  WRONG_CAUSALITY: {
    label: "Inverted causality",
    code: "CAUS",
    blurb: "Cause and effect swapped places, or the link points elsewhere.",
  },
  CORRELATION_AS_CAUSATION: {
    label: "Correlation as cause",
    code: "CORR",
    blurb: "What merely happens alongside is presented as what makes it happen.",
  },
  SURFACE_ONLY: {
    label: "Term without mechanism",
    code: "SURF",
    blurb: "The right word is used, but the machinery behind it is never named.",
  },
  OVERGENERALIZATION: {
    label: "Overgeneralization",
    code: "GENL",
    blurb: "A rule stretched past the conditions that make it true.",
  },
};

export const STATUS_META: Record<
  NodeStatusKind,
  { label: string; tone: "ok" | "warn" | "bad" | "void" }
> = {
  explained: { label: "explained", tone: "ok" },
  shallow: { label: "shallow", tone: "warn" },
  wrong: { label: "wrong", tone: "bad" },
  missing: { label: "missing", tone: "void" },
};
