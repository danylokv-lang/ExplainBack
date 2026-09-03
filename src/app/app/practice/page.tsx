import type { Metadata } from "next";
import { PracticeFlow } from "@/components/PracticeFlow";
import { PRESET_TOPICS } from "@/lib/store";

export const metadata: Metadata = { title: "Practice" };

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  return <PracticeFlow presets={PRESET_TOPICS} initialTopic={topic} />;
}
