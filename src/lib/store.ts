import type { ConceptMap } from "./types";
import topicsData from "../../data/topics.json";
import { readCachedMap, writeCachedMap } from "./db";
import { DEFAULT_LANGUAGE_CODE } from "./languages";

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

/**
 * A generated map is cached per (topic, response language) — the same topic
 * asked for in Ukrainian and in Spanish is two different documents, not one
 * cache entry that would otherwise serve the wrong language on a hit.
 * Presets are curated, English-only content and ignore language entirely.
 */
function cacheKey(topic: string, languageCode: string): string {
  return languageCode === DEFAULT_LANGUAGE_CODE
    ? slugify(topic)
    : `${slugify(topic)}--${languageCode}`;
}

/** Presets first (always English), then anything generated earlier and cached in D1. */
export async function getMap(
  topic: string,
  languageCode: string = DEFAULT_LANGUAGE_CODE,
): Promise<ConceptMap | undefined> {
  const preset = presetBySlug.get(slugify(topic));
  if (preset) return preset;
  return readCachedMap(cacheKey(topic, languageCode));
}

export async function saveMap(
  map: ConceptMap,
  languageCode: string = DEFAULT_LANGUAGE_CODE,
): Promise<void> {
  await writeCachedMap(cacheKey(map.topic, languageCode), map);
}
