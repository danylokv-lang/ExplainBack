import Link from "next/link";
import { notFound } from "next/navigation";
import { MapViewer } from "@/components/MapViewer";
import { readCachedMap } from "@/lib/db";
import { PRESET_TOPICS, getMap, slugify } from "@/lib/store";

export default async function MapPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const preset = PRESET_TOPICS.find((candidate) => slugify(candidate.topic) === slug);
  const map = preset ? getMap(preset.topic) : readCachedMap(slug);
  if (!map) notFound();

  return (
    <div className="space-y-8 py-10">
      <div>
        <Link href="/app/maps" className="label hover:text-ink">
          ← Map library
        </Link>
        <h1 className="mt-5 text-4xl leading-tight">{map.topic}</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-2">{map.brief}</p>
        <Link
          href={`/app/practice?topic=${encodeURIComponent(map.topic)}`}
          className="btn btn-primary mt-6"
        >
          Explain this topic
        </Link>
      </div>

      <div className="ruler" />

      <MapViewer map={map} />
    </div>
  );
}
