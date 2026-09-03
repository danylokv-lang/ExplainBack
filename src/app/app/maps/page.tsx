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
    <div className="space-y-10 py-10">
      <header>
        <p className="label">Map library</p>
        <h1 className="mt-3 text-4xl leading-tight">Reference concept maps</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-2">
          Each map is the load-bearing skeleton of a topic: five to eight concepts and the
          causal links between them. Every node carries a mechanism marker — the thing
          somebody who genuinely understands it cannot help saying — which is exactly what
          the diagnosis checks your text against.
        </p>
      </header>

      <section aria-labelledby="curated-heading">
        <h2 id="curated-heading" className="label">
          Curated
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {PRESET_TOPICS.map((preset) => (
            <li key={preset.id}>
              <Link
                href={`/app/maps/${slugify(preset.topic)}`}
                className="panel group flex h-full flex-col p-5 transition-colors duration-130 hover:border-rule-2 hover:bg-raised"
              >
                <span className="label">{preset.domain}</span>
                <span className="mt-3 font-display text-2xl leading-snug text-ink">
                  {preset.topic}
                </span>
                <span className="mt-3 text-sm leading-relaxed text-ink-2">{preset.brief}</span>
                <span className="label mt-5 border-t border-rule pt-3 tabular-nums">
                  {preset.nodeCount} concepts · {preset.edgeCount} links
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {generated.length > 0 && (
        <section aria-labelledby="generated-heading">
          <h2 id="generated-heading" className="label">
            Generated on demand
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {generated.map((map) => (
              <li key={map.slug}>
                <Link href={`/app/maps/${map.slug}`} className="btn btn-ghost px-3 py-1.5 text-xs">
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
