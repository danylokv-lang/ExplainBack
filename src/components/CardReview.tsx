"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { describeInterval, type Grade } from "@/lib/srs";
import { GAP_META, type StudyCard } from "@/lib/types";

const GRADES: { grade: Grade; label: string; help: string; tone: string }[] = [
  { grade: "again", label: "Not really", help: "Back in 10 minutes", tone: "text-bad" },
  { grade: "good", label: "Got it", help: "Normal interval", tone: "text-ink" },
  { grade: "easy", label: "Obvious", help: "Longer interval", tone: "text-ok" },
];

export function CardReview({ cards }: { cards: StudyCard[] }) {
  const router = useRouter();
  const [queue, setQueue] = useState(cards);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);
  const [busy, setBusy] = useState(false);
  const [lastInterval, setLastInterval] = useState<string | null>(null);

  const card = queue[index];

  async function grade(value: Grade) {
    if (!card || busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/cards/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.id, grade: value }),
      });
      const data = (await response.json()) as { interval?: string };
      setLastInterval(data.interval ?? describeInterval(0));
    } catch {
      setLastInterval(null);
    } finally {
      setBusy(false);
    }

    setDone((prev) => prev + 1);
    setRevealed(false);
    // Keeps the deck listing below in step with the schedule just written.
    router.refresh();

    if (value === "again") {
      // Keep it in this sitting: a card you just missed should come back today.
      setQueue((prev) => [...prev.slice(0, index), ...prev.slice(index + 1), card]);
      setIndex((prev) => Math.min(prev, queue.length - 1));
    } else {
      setQueue((prev) => prev.filter((_, i) => i !== index));
      setIndex((prev) => (prev >= queue.length - 1 ? 0 : prev));
    }
  }

  if (!card) {
    return (
      <div className="panel border-l-2 border-l-ok p-6">
        <p className="label text-ok">Deck clear</p>
        <h2 className="mt-2 text-2xl leading-tight">
          {done === 0 ? "Nothing due right now" : `${done} reviewed`}
        </h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-2">
          Cards come back on a widening schedule. New ones arrive whenever a session turns
          up gaps worth keeping.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/app/practice" className="btn btn-primary">
            Start a session
          </Link>
          <Link href="/app" className="btn btn-ghost">
            Back to overview
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="label">
          {card.topic}
          {card.gapType && ` · ${GAP_META[card.gapType].label}`}
        </p>
        <p className="label tabular-nums">
          {queue.length} left · {done} done
        </p>
      </div>

      <div className="panel mt-3 p-6 sm:p-8">
        <p className="font-display text-2xl leading-snug text-ink sm:text-3xl">{card.front}</p>

        {!revealed ? (
          <button
            type="button"
            className="btn btn-primary mt-7"
            onClick={() => setRevealed(true)}
          >
            Show the mechanism
          </button>
        ) : (
          <div className="anim-rise mt-7 space-y-5 border-t border-rule pt-6">
            <div>
              <p className="label">The mechanism</p>
              <p className="mt-2 leading-relaxed text-ink">{card.back}</p>
            </div>
            {card.trap && (
              <div>
                <p className="label text-warn">What you were tempted to say</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{card.trap}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {revealed && (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {GRADES.map((option) => (
            <button
              key={option.grade}
              type="button"
              disabled={busy}
              onClick={() => grade(option.grade)}
              className="panel px-4 py-3 text-left transition-colors duration-130 hover:border-rule-2 hover:bg-raised disabled:opacity-50"
            >
              <span className={`block text-sm font-medium ${option.tone}`}>{option.label}</span>
              <span className="label mt-1 block">{option.help}</span>
            </button>
          ))}
        </div>
      )}

      {lastInterval && (
        <p className="label mt-4" role="status" aria-live="polite">
          Last card scheduled in {lastInterval}
        </p>
      )}
    </div>
  );
}
