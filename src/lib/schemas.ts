/**
 * JSON Schemas for structured outputs (`output_config.format`).
 *
 * API constraints: no minLength/maxItems/minimum, every object carries
 * additionalProperties: false, and every property is listed in required.
 */

export const CONCEPT_MAP_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["brief", "nodes", "edges"],
  properties: {
    brief: {
      type: "string",
      description:
        "One sentence: what the student has to explain for the topic to count as covered.",
    },
    nodes: {
      type: "array",
      description: "Between 5 and 8 key concepts of the topic.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label", "definition", "mechanism", "misconception", "tier"],
        properties: {
          id: {
            type: "string",
            description: "kebab-case, unique within the map.",
          },
          label: { type: "string", description: "Concept name, 1-3 words." },
          definition: {
            type: "string",
            description: "A single short sentence of definition.",
          },
          mechanism: {
            type: "string",
            description:
              "The mechanism marker: what somebody with genuine understanding cannot help saying about this concept. Not a definition — the working principle: what acts on what, and why.",
          },
          misconception: {
            type: "string",
            description: "The faulty model students typically hold about this concept, one sentence.",
          },
          tier: {
            type: "string",
            enum: ["core", "supporting"],
            description: "core - the topic collapses without it; supporting - it qualifies the picture.",
          },
        },
      },
    },
    edges: {
      type: "array",
      description:
        "Between 4 and 10 causal links between nodes. Only ids from the node list.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["from", "to", "relation", "label"],
        properties: {
          from: { type: "string" },
          to: { type: "string" },
          relation: {
            type: "string",
            enum: ["causes", "requires", "produces", "enables"],
            description:
              "causes - A brings B about; requires - B is impossible without A; produces - A yields B as a product; enables - A makes B possible but not sufficient.",
          },
          label: { type: "string", description: "Plain-language label for the link, 2-5 words." },
        },
      },
    },
  },
} as const;

export const DIAGNOSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "coverage",
    "depth",
    "verdict",
    "nextStep",
    "nodeStatuses",
    "gaps",
    "repair",
    "resolvedGapIds",
  ],
  properties: {
    coverage: {
      type: "integer",
      description: "0-100. Share of map nodes the student named and unpacked.",
    },
    depth: {
      type: "integer",
      description:
        "0-100. How far the explanation rests on mechanism rather than terminology. A low score alongside correct vocabulary is the signature of the illusion of understanding.",
    },
    verdict: {
      type: "string",
      description:
        "One line addressed to the student. Concrete, with no praise for its own sake.",
    },
    nextStep: {
      type: "string",
      description:
        "One short imperative sentence naming the single most important thing to fix next, built around the highest-severity gap: 'Understand <concept>'s role in <mechanism>.' Names a concept from the map, not a vague instruction like 'review the material'.",
    },
    nodeStatuses: {
      type: "array",
      description: "Exactly one entry per map node, in the same order.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["nodeId", "status", "evidence"],
        properties: {
          nodeId: { type: "string" },
          status: {
            type: "string",
            enum: ["explained", "shallow", "wrong", "missing"],
            description:
              "explained - named and the mechanism is present; shallow - the term is there, the mechanism is not; wrong - stated incorrectly; missing - never mentioned.",
          },
          evidence: {
            type: "string",
            description:
              "Verbatim fragment of the student's explanation the status rests on. Empty string for status=missing.",
          },
        },
      },
    },
    gaps: {
      type: "array",
      description:
        "Gaps found, most important first. At most 5. Empty array if the explanation is genuinely complete.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "type", "severity", "nodeIds", "edge", "title", "evidence", "why"],
        properties: {
          id: { type: "string", description: "kebab-case and unique, e.g. 'gap-atp-source'." },
          type: {
            type: "string",
            enum: [
              "MISSING_CONCEPT",
              "WRONG_CAUSALITY",
              "CORRELATION_AS_CAUSATION",
              "SURFACE_ONLY",
              "OVERGENERALIZATION",
            ],
          },
          severity: { type: "string", enum: ["high", "medium", "low"] },
          nodeIds: {
            type: "array",
            description: "Map nodes the gap concerns. At least one.",
            items: { type: "string" },
          },
          edge: {
            description:
              "The map edge, when the gap is about causality. Otherwise null.",
            anyOf: [
              {
                type: "object",
                additionalProperties: false,
                required: ["from", "to"],
                properties: { from: { type: "string" }, to: { type: "string" } },
              },
              { type: "null" },
            ],
          },
          title: {
            type: "string",
            description: "Title of the gap, up to 8 words, no generic phrasing.",
          },
          evidence: {
            type: "string",
            description:
              "Verbatim quote from the student. Empty string only for MISSING_CONCEPT.",
          },
          why: {
            type: "string",
            description:
              "1-2 sentences: why this is a gap and what it breaks in the mechanism. Without restating the correct answer.",
          },
        },
      },
    },
    repair: {
      type: "array",
      description:
        "1-3 Socratic questions aimed at the hardest gaps. A question leads the student to the answer and never states it.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "gapId", "question", "hint"],
        properties: {
          id: { type: "string" },
          gapId: { type: "string", description: "Id of a gap from the gaps list." },
          question: {
            type: "string",
            description:
              "A Socratic question: a thought experiment or edge case that makes the gap palpable.",
          },
          hint: {
            type: "string",
            description:
              "2-3 sentences of click-to-reveal hint. It directs attention but leaves the conclusion to the student.",
          },
        },
      },
    },
    resolvedGapIds: {
      type: "array",
      description:
        "Second attempt only: ids of previous-attempt gaps the student closed this time. Otherwise an empty array.",
      items: { type: "string" },
    },
  },
} as const;

export const CARDS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["cards"],
  properties: {
    cards: {
      type: "array",
      description: "Between 1 and 5 study cards, hardest gap first.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["gapId", "front", "back", "trap"],
        properties: {
          gapId: {
            type: "string",
            description:
              "Id of the gap this card repairs, or an empty string when the card comes from a weak map node rather than a listed gap.",
          },
          front: {
            type: "string",
            description:
              "A question about the mechanism. Answerable in 2-3 sentences by someone who understands, unanswerable by someone who only memorised the term.",
          },
          back: {
            type: "string",
            description: "The working principle, stated concretely. 2-4 sentences.",
          },
          trap: {
            type: "string",
            description:
              "The plausible wrong answer this card exists to disarm — what the learner is likely to say instead. One sentence.",
          },
        },
      },
    },
  },
} as const;
