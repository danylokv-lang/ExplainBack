import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { listGeneratedMaps } from "@/lib/db";
import { PRESET_TOPICS, slugify } from "@/lib/store";

export const metadata: Metadata = { title: "Map library" };

export default async function MapsPage() {
  await currentUser();
  const presetSlugs = new Set(PRESET_TOPICS.map((preset) => slugify(preset.topic)));
  const generated = listGeneratedMaps().filter((map) => !presetSlugs.has(map.slug));

  return (
    <div className="space-y-12 py-12">
      <header>
        <p className="label">Map library</p>
        <h1 className="display mt-2 text-4xl">Reference Concept Maps</h1>
        <p className="prose-measure mt-4 text-lg leading-relaxed text-ink-2">
          Each map is the load-bearing skeleton of a topic: five to eight concepts and the
          causal links between them. Every concept records what someone who genuinely
          understands it would have to say — that is what your text gets checked against.
        </p>
      </header>

      <section aria-labelledby="curated-heading">
        <h2 id="curated-heading" className="display text-2xl">
          Curated
        </h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {PRESET_TOPICS.map((preset) => (
            <li key={preset.id}>
              <Link
                href={`/app/maps/${slugify(preset.topic)}`}
                className="panel card-hover flex h-full flex-col p-6"
              >
                <span className="text-sm text-ink-3">{preset.domain}</span>
                <span className="display mt-2 text-2xl text-ink">{preset.topic}</span>
                <span className="mt-3 leading-relaxed text-ink-2">{preset.brief}</span>
                <span className="mt-6 border-t border-rule pt-4 text-sm tabular-nums text-ink-3">
                  {preset.nodeCount} concepts · {preset.edgeCount} links
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {generated.length > 0 && (
        <section aria-labelledby="generated-heading">
          <h2 id="generated-heading" className="display text-2xl">
            Generated on Demand
          </h2>
          <ul className="mt-5 flex flex-wrap gap-2.5">
            {generated.map((map) => (
              <li key={map.slug}>
                <Link href={`/app/maps/${map.slug}`} className="btn btn-ghost px-4 py-2.5 text-sm">
                  {map.topic}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
