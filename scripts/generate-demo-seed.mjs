#!/usr/bin/env node
/**
 * Generates a SQL file that seeds one account with a realistic-looking demo
 * history: three finished sessions (each explained twice), the gaps that got
 * closed on the second attempt, and a deck of study cards.
 *
 * This does NOT touch any database itself, and it never runs automatically —
 * a real user's dashboard should only ever show what that user actually did.
 * Review the generated .sql before applying it, and only apply it against an
 * account you're using for a demo, never a real learner's account.
 *
 * Usage:
 *   node scripts/generate-demo-seed.mjs you@example.com > demo-seed.sql
 *   npx wrangler d1 execute explainback --local  --file=demo-seed.sql   # local dev
 *   npx wrangler d1 execute explainback --remote --file=demo-seed.sql   # production
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/generate-demo-seed.mjs <account-email>");
  process.exit(1);
}

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const topics = JSON.parse(readFileSync(path.join(root, "data/topics.json"), "utf8")).topics;
const byTopic = Object.fromEntries(topics.map((t) => [t.topic, t]));

function mapFor(topicName) {
  const t = byTopic[topicName];
  return {
    topic: t.topic,
    brief: t.brief,
    nodes: t.nodes,
    edges: t.edges,
    source: "preset",
  };
}

function status(nodeId, status, evidence = "") {
  return { nodeId, status, evidence };
}

function allStatuses(topicName, overrides) {
  const t = byTopic[topicName];
  const byId = new Map(overrides.map((s) => [s.nodeId, s]));
  return t.nodes.map((n) => byId.get(n.id) ?? status(n.id, "explained", "covered in the explanation"));
}

function gap(id, type, severity, nodeIds, edge, title, evidence, why) {
  return { id, type, severity, nodeIds, edge, title, evidence, why };
}

function question(id, gapId, q, hint) {
  return { id, gapId, question: q, hint };
}

// ---------------------------------------------------------------- session 1
const respMap = mapFor("Cellular Respiration");
const resp1Gaps = [
  gap("g1", "MISSING_CONCEPT", "high", ["glycolysis"], null, "Glycolysis never appears", "", "The first splitting step is skipped entirely, so the sequence starts one stage later than it does in the cell."),
  gap("g2", "MISSING_CONCEPT", "high", ["gradient", "etc"], { from: "etc", to: "gradient" }, "Nothing sits between the chain and ATP", "", "The intermediate form the energy is briefly held in — the proton gradient — never appears."),
  gap("g3", "SURFACE_ONLY", "medium", ["krebs"], null, "Krebs cycle named, not described", "the Krebs cycle makes a lot of ATP", "The cycle's real output — electrons loaded onto carriers — is left unnamed."),
  gap("g4", "WRONG_CAUSALITY", "medium", ["mitochondria"], null, "Mitochondria treated as sufficient on their own", "mitochondria are the powerhouse", "The organelle is equipment, not a supply — it produces nothing without fuel and oxygen."),
  gap("g5", "CORRELATION_AS_CAUSATION", "low", ["oxygen"], null, "Oxygen justified by respiration itself", "oxygen is needed to respire", "The reasoning closes on itself instead of naming what oxygen actually does in the chain."),
];
const resp1 = {
  coverage: 62, depth: 18,
  verdict: "You have the vocabulary. Where the ATP actually comes from is still missing.",
  nextStep: "Understand what sits between the electron transport chain and ATP synthesis.",
  nodeStatuses: allStatuses("Cellular Respiration", [
    status("glucose", "shallow", "the cell breaks down glucose for energy"),
    status("glycolysis", "missing"),
    status("mitochondria", "wrong", "mitochondria are the powerhouse of the cell"),
    status("krebs", "shallow", "the Krebs cycle makes a lot of ATP"),
    status("etc", "missing"),
    status("oxygen", "shallow", "oxygen is needed to respire"),
    status("gradient", "missing"),
    status("atp", "shallow", "ATP is the energy currency"),
  ]),
  gaps: resp1Gaps,
  repair: [
    question("q1", "g2", "If the inner membrane sprang a leak, oxygen and fuel both present, why would ATP output collapse?", "The chain still pumps protons and oxygen still gets consumed — think about what the gradient itself is doing between the two."),
    question("q2", "g5", "Why does low oxygen stall the Krebs cycle, which uses no oxygen directly?", "Follow where the electron carriers go once nothing is left to accept them at the end of the chain."),
  ],
  resolvedGapIds: [],
};
const resp2 = {
  coverage: 91, depth: 55,
  verdict: "The chain holds together now — oxygen's exact job is the one piece still thin.",
  nextStep: "Name precisely what oxygen accepts at the end of the electron transport chain.",
  nodeStatuses: allStatuses("Cellular Respiration", [
    status("etc", "explained", "each complex passes electrons down and pumps protons across"),
    status("gradient", "explained", "the proton gradient stores the energy until ATP synthase uses it"),
    status("glycolysis", "explained", "glucose is split in the cytoplasm first, before the mitochondria"),
    status("oxygen", "shallow", "oxygen is needed at the very end of the chain"),
  ]),
  gaps: [
    gap("g6", "SURFACE_ONLY", "medium", ["oxygen"], null, "Oxygen's exact role still unnamed", "oxygen is needed at the very end of the chain", "\"Needed at the end\" doesn't yet say oxygen is the electron acceptor that keeps the chain from backing up."),
  ],
  repair: [
    question("q3", "g6", "What specifically would pile up first if oxygen ran out?", "Trace the electrons one hop at a time to the very last complex in the chain."),
  ],
  resolvedGapIds: ["g1", "g2", "g4"],
};

// ---------------------------------------------------------------- session 2
const recMap = mapFor("Recursion in Programming");
const rec1Gaps = [
  gap("r1", "MISSING_CONCEPT", "high", ["reduction"], null, "No mention of why the input shrinks", "", "Termination isn't guaranteed by having a base case — it's guaranteed by the input moving toward it."),
  gap("r2", "SURFACE_ONLY", "high", ["unwinding"], null, "Return journey glossed over", "the function keeps calling itself until it stops", "Nothing is said about the computation actually happening on the way back up, not down."),
  gap("r3", "WRONG_CAUSALITY", "medium", ["call-stack"], null, "Stack described as shared state", "all the calls use the same variables", "Each call gets its own frame — that's precisely why the copies don't overwrite each other."),
  gap("r4", "OVERGENERALIZATION", "low", ["stack-overflow"], null, "Stack overflow called a random error", "sometimes it just crashes", "It's a direct, physical consequence of frames outpacing returns, not randomness."),
];
const rec1 = {
  coverage: 58, depth: 22,
  verdict: "You can describe recursion calling itself. What makes it stop is still hand-wavy.",
  nextStep: "Explain why the input has to shrink toward the base case, not just that a base case exists.",
  nodeStatuses: allStatuses("Recursion in Programming", [
    status("self-call", "shallow", "a function that calls itself"),
    status("reduction", "missing"),
    status("base-case", "shallow", "you need a base case so it doesn't error"),
    status("call-stack", "wrong", "all the calls use the same variables"),
    status("unwinding", "shallow", "the function keeps calling itself until it stops"),
    status("stack-overflow", "shallow", "sometimes it just crashes"),
    status("trust", "missing"),
  ]),
  gaps: rec1Gaps,
  repair: [
    question("q4", "r1", "Would a base case alone stop a function called with the same argument every time?", "Ask what actually changes between one call and the next — the base case only matters if something is moving toward it."),
    question("q5", "r3", "If every call shared one set of variables, what would happen to a countdown from 5 to 1?", "Picture five overlapping calls all trying to hold their own current number at once."),
  ],
  resolvedGapIds: [],
};
const rec2 = {
  coverage: 86, depth: 58,
  verdict: "Solid now — the only soft spot left is naming stack overflow as a physical, not random, failure.",
  nextStep: "Describe stack overflow as frames accumulating faster than they return, not as a random crash.",
  nodeStatuses: allStatuses("Recursion in Programming", [
    status("reduction", "explained", "each call gets an input closer to the base case"),
    status("call-stack", "explained", "every call pushes its own frame with its own variables"),
    status("unwinding", "explained", "results only start returning once the base case fires"),
    status("stack-overflow", "shallow", "too many calls and it crashes"),
  ]),
  gaps: [
    gap("r5", "OVERGENERALIZATION", "low", ["stack-overflow"], null, "Overflow still framed as unpredictable", "too many calls and it crashes", "It's not unpredictable — frames pile up because the return journey hasn't started yet."),
  ],
  repair: [
    question("q6", "r5", "If the base case were unreachable, at what point exactly does the crash happen?", "Think about what's filling up while no call has anything to return yet."),
  ],
  resolvedGapIds: ["r1", "r2", "r3"],
};

// ---------------------------------------------------------------- session 3
const sdMap = mapFor("Supply and Demand");
const sd1Gaps = [
  gap("s1", "CORRELATION_AS_CAUSATION", "high", ["shift-vs-move"], null, "Price rise blamed on demand rising", "demand went up so the price went up", "That restates the observation. A price change along one curve isn't the same as the curve itself shifting."),
  gap("s2", "MISSING_CONCEPT", "medium", ["opportunity-cost"], null, "Supply's own logic unexplained", "", "Nothing is said about why sellers need a higher price to bring in the next unit."),
  gap("s3", "WRONG_CAUSALITY", "medium", ["price-control"], null, "Price cap assumed to simply lower cost", "a price cap makes it cheaper for everyone", "A binding cap changes who pays and how, not how much it costs to make the good."),
];
const sd1 = {
  coverage: 55, depth: 30,
  verdict: "You know supply and demand move prices. Why each curve slopes the way it does is still missing.",
  nextStep: "Explain why the supply curve slopes upward in terms of each seller's next-best alternative.",
  nodeStatuses: allStatuses("Supply and Demand", [
    status("willingness-to-pay", "shallow", "buyers pay less when the price is lower"),
    status("opportunity-cost", "missing"),
    status("demand-curve", "shallow", "demand is how much people want to buy"),
    status("supply-curve", "shallow", "supply is how much sellers want to sell"),
    status("shift-vs-move", "wrong", "demand went up so the price went up"),
    status("equilibrium", "shallow", "equilibrium is where supply meets demand"),
    status("shortage-surplus", "missing"),
    status("price-control", "wrong", "a price cap makes it cheaper for everyone"),
  ]),
  gaps: sd1Gaps,
  repair: [
    question("q7", "s1", "If nothing about the good changed but people simply wanted more of it, what actually moves?", "Distinguish a change along the existing schedule from a change to the schedule itself."),
    question("q8", "s3", "If a price cap doesn't lower the true cost, what has to change instead when demand still exceeds supply at that price?", "Think about what happens when quantity demanded and quantity supplied stop matching."),
  ],
  resolvedGapIds: [],
};
const sd2 = {
  coverage: 74, depth: 59,
  verdict: "Better — the shift-versus-move confusion is gone. Supply's own logic and price controls are still thin.",
  nextStep: "Explain why the supply curve slopes upward in terms of each seller's next-best alternative.",
  nodeStatuses: allStatuses("Supply and Demand", [
    status("shift-vs-move", "explained", "a price change moves you along the curve; only other factors shift it"),
    status("opportunity-cost", "shallow", "sellers need a higher price to supply more"),
    status("price-control", "wrong", "a price cap makes it cheaper for everyone"),
  ]),
  gaps: [
    gap("s4", "MISSING_CONCEPT", "medium", ["opportunity-cost"], null, "Supply's slope still unexplained", "sellers need a higher price to supply more", "Restates that supply slopes up without saying why — each extra unit comes from a costlier next-best alternative."),
    gap("s5", "WRONG_CAUSALITY", "medium", ["price-control", "shortage-surplus"], { from: "price-control", to: "shortage-surplus" }, "Price cap still treated as pure savings", "a price cap makes it cheaper for everyone", "A binding cap doesn't remove the gap between supply and demand — it just moves who absorbs it, often through queues or shortages."),
  ],
  repair: [
    question("q9", "s4", "Two sellers face the same price. Why does one supply and the other hold back?", "Compare what each seller gives up elsewhere to make this particular unit."),
    question("q10", "s5", "If a price cap really made the good cheaper for everyone who wanted it, why would queues or shortages ever appear under one?", "Ask what happens to quantity supplied specifically once price can't rise to meet demand."),
  ],
  resolvedGapIds: ["s1"],
};

// -------------------------------------------------------------------- SQL
function esc(value) {
  return String(value).replace(/'/g, "''");
}
function json(value) {
  return esc(JSON.stringify(value));
}

const now = Date.now();
const daysAgo = (n) => new Date(now - n * 86_400_000).toISOString().slice(0, 19).replace("T", " ");

const lines = [];
lines.push("-- Generated by scripts/generate-demo-seed.mjs — review before applying.");
lines.push(`-- Seeds a demo history onto the account: ${email}`);
lines.push("");

const sessions = [
  { map: respMap, created: daysAgo(6), a1: resp1, a2: resp2, e1: "reasp-e1", e2: "resp-e2" },
  { map: recMap, created: daysAgo(3), a1: rec1, a2: rec2, e1: "rec-e1", e2: "rec-e2" },
  { map: sdMap, created: daysAgo(1), a1: sd1, a2: sd2, e1: "sd-e1", e2: "sd-e2" },
];

const explanations = {
  "reasp-e1":
    "Cellular respiration is how the cell gets energy from glucose. Glucose goes into the mitochondria, and the Krebs cycle makes a lot of ATP there. Mitochondria are the powerhouse of the cell, so more of them means more energy. Oxygen is needed to respire.",
  "resp-e2":
    "Glucose is split in the cytoplasm first, in glycolysis, before anything reaches the mitochondria. The pyruvate then enters the matrix, where the Krebs cycle strips electrons onto carriers. Those carriers hand electrons to the transport chain, which pumps protons across the inner membrane to build a gradient, and ATP synthase uses that gradient to make ATP. Oxygen is needed at the very end of the chain.",
  "rec-e1":
    "Recursion is when a function calls itself. You need a base case or it errors. All the calls use the same variables while it runs, and sometimes it just crashes if there are too many calls.",
  "rec-e2":
    "Each recursive call passes an input that's closer to the base case, which is what actually guarantees it stops, not just having a base case. Each call gets its own stack frame with its own copy of the variables. The base case is the first call that returns without calling again, and every call above it returns afterward, in reverse order. Too many calls and it crashes.",
  "sd-e1":
    "Demand is how much people want to buy and supply is how much sellers want to sell. Equilibrium is where they meet. Demand went up so the price went up. A price cap makes it cheaper for everyone.",
  "sd-e2":
    "A price change along the demand curve is different from the whole curve shifting — only something other than the good's own price shifts it. Sellers need a higher price to bring in the next unit because each one comes from whoever's next-best alternative is priciest. A price cap doesn't remove the gap between what people want to buy and what sellers will supply at that price.",
};

for (const s of sessions) {
  lines.push(
    `INSERT INTO runs (user_id, topic, map, created_at) SELECT id, '${esc(s.map.topic)}', '${json(s.map)}', '${s.created}' FROM users WHERE email = '${esc(email)}';`,
  );
  const runRef = `(SELECT id FROM runs WHERE user_id = (SELECT id FROM users WHERE email = '${esc(email)}') AND topic = '${esc(s.map.topic)}' AND created_at = '${s.created}')`;
  lines.push(
    `INSERT INTO attempts (run_id, idx, explanation, diagnosis, elapsed_ms, created_at) VALUES (${runRef}, 1, '${esc(explanations[s.e1])}', '${json(s.a1)}', 5100, '${s.created}');`,
  );
  const retryAt = daysAgo(0);
  lines.push(
    `INSERT INTO attempts (run_id, idx, explanation, diagnosis, elapsed_ms, created_at) VALUES (${runRef}, 2, '${esc(explanations[s.e2])}', '${json(s.a2)}', 4700, '${retryAt}');`,
  );
}

// study cards: 12 total, due now, spread across all three topics/gap types
const cardSpecs = [
  ["Cellular Respiration", "MISSING_CONCEPT", "A drug makes the inner mitochondrial membrane leaky to protons. Oxygen use goes up, not down. Why does the cell make less ATP anyway?", "The chain keeps pulling electrons and pumping protons, so oxygen keeps being consumed. But protons leak straight back instead of passing through ATP synthase, so the gradient never builds and the turbine never turns.", "Assuming oxygen consumption and ATP output must rise and fall together."],
  ["Cellular Respiration", "SURFACE_ONLY", "If the Krebs cycle barely makes ATP directly, what does it actually hand on?", "It strips electrons off acetyl-CoA onto NADH and FADH2 — the cycle's real output, carried onward to the transport chain.", "Saying the Krebs cycle produces most of the ATP directly."],
  ["Cellular Respiration", "CORRELATION_AS_CAUSATION", "Why does low oxygen stall the Krebs cycle, which uses no oxygen itself?", "With nothing accepting electrons at the end of the chain, carriers can't be re-oxidised, so the cycle runs out of free carriers to load.", "Answering that the cycle needs oxygen directly."],
  ["Cellular Respiration", "WRONG_CAUSALITY", "A cell has plenty of mitochondria but almost no glucose. Does it have plenty of energy?", "No — mitochondria are equipment, not fuel. Without substrate to oxidise, extra organelles produce nothing.", "Treating organelle count alone as the limiting factor for energy output."],
  ["Recursion in Programming", "MISSING_CONCEPT", "Two functions both have a correct base case, but only one terminates on every input. What's different?", "Only one guarantees the argument moves toward the base case on every call — a base case alone doesn't force convergence.", "Assuming a correct base case is sufficient for termination by itself."],
  ["Recursion in Programming", "SURFACE_ONLY", "Where does the actual computed answer come from — the way down, or the way back up?", "The way back up. Until the base case fires, no call has anything to return, so the result is built during unwinding.", "Believing the answer accumulates during the descent into deeper calls."],
  ["Recursion in Programming", "WRONG_CAUSALITY", "If two recursive calls shared one set of variables, what would break first?", "Concurrent calls would overwrite each other's locals — separate stack frames are exactly what prevents that.", "Assuming all active calls read and write the same variables."],
  ["Recursion in Programming", "OVERGENERALIZATION", "Is a stack overflow a random interpreter glitch?", "No — it's frames accumulating faster than they return, a direct and predictable consequence of unreached termination.", "Treating stack overflow as unpredictable rather than mechanical."],
  ["Supply and Demand", "CORRELATION_AS_CAUSATION", "Something raises willingness to pay at every price. Did demand rise, or did price just move along the curve?", "Demand itself shifted — the whole schedule moved, which is different from a price change moving you along a fixed schedule.", "Treating any price increase as proof that demand rose."],
  ["Supply and Demand", "MISSING_CONCEPT", "Why does it take a higher price to bring in the next unit of supply?", "Each additional unit comes from whoever's next-best alternative is priciest, so a higher price is needed to outbid that alternative.", "Assuming sellers supply more simply because they want more revenue."],
  ["Supply and Demand", "WRONG_CAUSALITY", "A binding price cap is introduced. Does the good become cheaper to produce?", "No — production cost is unchanged. The cap only changes who gets the good and how, often via queues or shortages.", "Confusing a lower legal price with a lower cost of production."],
  ["Supply and Demand", "WRONG_CAUSALITY", "Under a binding price cap, why do shortages appear even though the price looks low?", "Quantity supplied at the capped price falls short of quantity demanded — the gap doesn't vanish, it just isn't priced anymore.", "Assuming a lower price alone guarantees availability."],
];

for (const [topic, type, front, back, trap] of cardSpecs) {
  const runRefForTopic = `(SELECT id FROM runs WHERE user_id = (SELECT id FROM users WHERE email = '${esc(email)}') AND topic = '${esc(topic)}' ORDER BY created_at DESC LIMIT 1)`;
  lines.push(
    `INSERT INTO cards (user_id, run_id, topic, gap_type, front, back, trap, due_at) SELECT id, ${runRefForTopic}, '${esc(topic)}', '${type}', '${esc(front)}', '${esc(back)}', '${esc(trap)}', datetime('now') FROM users WHERE email = '${esc(email)}';`,
  );
}

console.log(lines.join("\n"));
