import type { ConceptMap } from "./types";
import topicsData from "../../data/topics.json";
import { readCachedMap, writeCachedMap } from "./db";

/** Preset topics ship with their map already built, so a session starts instantly. */
export interface PresetTopic {
  id: string;
  topic: string;
  domain: string;
  brief: string;
  /** A realistic weak explanation — speeds up demos and manual testing */
  sample: string;
  nodeCount: number;
  edgeCount: number;
}

const PRESETS = topicsData.topics as unknown as (Omit<
  PresetTopic,
  "nodeCount" | "edgeCount"
> & {
  nodes: ConceptMap["nodes"];
  edges: ConceptMap["edges"];
})[];

export const PRESET_TOPICS: PresetTopic[] = PRESETS.map(
  ({ id, topic, domain, brief, sample, nodes, edges }) => ({
    id,
    topic,
    domain,
    brief,
    sample,
    nodeCount: nodes.length,
    edgeCount: edges.length,
  }),
);

export function slugify(topic: string): string {
  return topic
    .trim()
    .toLowerCase()
    // Apostrophes vanish rather than becoming separators, so "Ohm's Law"
    // reads as ohms-law instead of ohm-s-law.
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

const presetBySlug = new Map<string, ConceptMap>(
  PRESETS.map((preset) => [
    slugify(preset.topic),
    {
      topic: preset.topic,
      brief: preset.brief,
      nodes: preset.nodes,
      edges: preset.edges,
      source: "preset" as const,
    },
  ]),
);

export function findPreset(topic: string): PresetTopic | undefined {
  const slug = slugify(topic);
  return PRESET_TOPICS.find((preset) => slugify(preset.topic) === slug);
}

/** Presets first, then anything generated earlier and stored in D1. */
export async function getMap(topic: string): Promise<ConceptMap | undefined> {
  const slug = slugify(topic);
  return presetBySlug.get(slug) ?? (await readCachedMap(slug));
}

export async function saveMap(map: ConceptMap): Promise<void> {
  await writeCachedMap(slugify(map.topic), map);
}
