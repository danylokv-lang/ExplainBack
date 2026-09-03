import type { Diagnosis } from "./types";

/**
 * A worked example used on the marketing pages. It is the diagnosis of the
 * sample explanation shipped with the cellular respiration preset — real
 * output shape, so the landing page shows the product rather than a mockup.
 */
export const SHOWCASE_EXPLANATION =
  "Cellular respiration is the process where the cell gets energy from glucose. Glucose goes into the mitochondria, and the Krebs cycle happens there, which produces a lot of ATP. Mitochondria are called the powerhouse of the cell because they are the ones that make ATP. Oxygen is needed because without oxygen the cell can't respire. The more mitochondria a cell has, the more energy it has.";

export const SHOWCASE_DIAGNOSIS: Diagnosis = {
  coverage: 56,
  depth: 18,
  verdict:
    "You know every term. Where the ATP actually comes from never appears once.",
  nodeStatuses: [
    { nodeId: "glucose", status: "shallow", evidence: "the cell gets energy from glucose" },
    { nodeId: "glycolysis", status: "missing", evidence: "" },
    {
      nodeId: "mitochondria",
      status: "wrong",
      evidence: "The more mitochondria a cell has, the more energy it has",
    },
    {
      nodeId: "krebs",
      status: "shallow",
      evidence: "the Krebs cycle happens there, which produces a lot of ATP",
    },
    { nodeId: "etc", status: "missing", evidence: "" },
    {
      nodeId: "oxygen",
      status: "shallow",
      evidence: "Oxygen is needed because without oxygen the cell can't respire",
    },
    { nodeId: "gradient", status: "missing", evidence: "" },
    { nodeId: "atp", status: "shallow", evidence: "they are the ones that make ATP" },
  ],
  gaps: [
    {
      id: "gap-glycolysis-place",
      type: "WRONG_CAUSALITY",
      severity: "high",
      nodeIds: ["glycolysis", "mitochondria"],
      edge: { from: "glucose", to: "glycolysis" },
      title: "The glucose is sent to the wrong place",
      evidence: "Glucose goes into the mitochondria",
      why: "The first splitting step disappeared along with the compartment it happens in, so your whole sequence starts one stage later than it does in the cell.",
    },
    {
      id: "gap-no-gradient",
      type: "MISSING_CONCEPT",
      severity: "high",
      nodeIds: ["gradient", "etc"],
      edge: { from: "etc", to: "gradient" },
      title: "Nothing sits between oxidation and ATP",
      evidence: "",
      why: "You name the start of the chain and its result, but the intermediate form the energy is briefly held in never appears. That is precisely where the mechanism comes apart.",
    },
    {
      id: "gap-krebs-atp",
      type: "SURFACE_ONLY",
      severity: "high",
      nodeIds: ["krebs"],
      edge: null,
      title: "The Krebs cycle is named, never described",
      evidence: "the Krebs cycle happens there, which produces a lot of ATP",
      why: "The name is used correctly, but what the cycle strips off the fuel and hands on is not stated. \"Produces a lot of ATP\" hides the entire stage that follows.",
    },
    {
      id: "gap-oxygen-tautology",
      type: "CORRELATION_AS_CAUSATION",
      severity: "medium",
      nodeIds: ["oxygen"],
      edge: null,
      title: "Oxygen is explained by respiration itself",
      evidence: "Oxygen is needed because without oxygen the cell can't respire",
      why: "The reasoning closes on itself: oxygen is justified by the presence of respiration. What oxygen does inside the chain is left unnamed.",
    },
    {
      id: "gap-more-mito",
      type: "OVERGENERALIZATION",
      severity: "medium",
      nodeIds: ["mitochondria"],
      edge: null,
      title: "Organelle count equated with energy",
      evidence: "The more mitochondria a cell has, the more energy it has",
      why: "The rule is stated with no condition attached, though it only holds while fuel and oxygen last. The organelle on its own produces nothing.",
    },
  ],
  repair: [
    {
      id: "q-1",
      gapId: "gap-no-gradient",
      question:
        "Imagine a hole opens in the inner mitochondrial membrane and protons pass freely both ways. The chain runs, oxygen is there, fuel is there — why is there still no ATP?",
      hint: "Think about what the chain does with the energy it strips off the electrons: it does not pack it into a molecule, it moves protons somewhere. If the difference between the two sides disappears, so does whatever ATP synthase was using.",
    },
    {
      id: "q-2",
      gapId: "gap-oxygen-tautology",
      question:
        "Why does a shortage of oxygen stall the Krebs cycle, which uses no oxygen itself?",
      hint: "Follow where NADH and FADH2 go if nobody is left to take the electrons at the end of the chain. The cycle needs free carriers, not oxygen — and those are different things.",
    },
    {
      id: "q-3",
      gapId: "gap-more-mito",
      question:
        "What happens to a cell with twice the mitochondria but half the glucose?",
      hint: "Try separating the capacity to process from the thing there is to process. A mitochondrion is equipment, not a supply.",
    },
  ],
  resolvedGapIds: [],
};

export const SHOWCASE_CARD = {
  front:
    "A drug makes the inner mitochondrial membrane leaky to protons. Oxygen use goes up, not down. Why does the cell make less ATP anyway?",
  back: "The chain keeps pulling electrons and pumping protons, so oxygen keeps being consumed at the end of it. But the protons leak straight back instead of passing through ATP synthase, so the gradient never builds and the turbine never turns. The energy leaves as heat rather than as ATP.",
  trap: "Saying oxygen consumption and ATP output must rise and fall together, because oxygen is treated as the fuel rather than as the electron sink.",
};
