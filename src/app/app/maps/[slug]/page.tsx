import Link from "next/link";
import { notFound } from "next/navigation";
import { MapViewer } from "@/components/MapViewer";
import { readCachedMap } from "@/lib/db";
import { PRESET_TOPICS, getMap, slugify } from "@/lib/store";

export default async function MapPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const preset = PRESET_TOPICS.find((candidate) => slugify(candidate.topic) === slug);
  const map = preset ? await getMap(preset.topic) : await readCachedMap(slug);
  if (!map) notFound();

  return (
    <div className="space-y-9 py-12">
      <div>
        <Link href="/app/maps" className="text-[0.9375rem] text-ink-2 hover:text-ink">
          ← Map library
        </Link>
        <h1 className="display mt-6 text-4xl">{map.topic}</h1>
        <p className="prose-measure mt-4 text-lg leading-relaxed text-ink-2">{map.brief}</p>
        <Link
          href={`/app/practice?topic=${encodeURIComponent(map.topic)}`}
          className="btn btn-primary mt-7"
        >
          Explain This Topic
        </Link>
      </div>

      <MapViewer map={map} />
    </div>
  );
}
