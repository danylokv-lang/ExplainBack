"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { describeInterval, type Grade } from "@/lib/srs";
import { GAP_META, type StudyCard } from "@/lib/types";

const GRADES: { grade: Grade; label: string; help: string; tone: string }[] = [
  { grade: "again", label: "Not Really", help: "Back in 10 minutes", tone: "text-bad" },
  { grade: "good", label: "Got It", help: "Normal interval", tone: "text-ink" },
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
      <div className="panel border-l-[3px] border-l-ok p-6">
        <h2 className="display text-2xl">
          {done === 0 ? "Nothing Due Right Now" : `${done} Reviewed — Deck Clear`}
        </h2>
        <p className="prose-measure mt-3 leading-relaxed text-ink-2">
          Cards come back on a widening schedule. New ones arrive whenever a session turns
          up gaps worth keeping.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/app/practice" className="btn btn-primary">
            Start a Session
          </Link>
          <Link href="/app" className="btn btn-ghost">
            Back to Overview
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-sm text-ink-3">
          {card.topic}
          {card.gapType && ` · ${GAP_META[card.gapType].label}`}
        </p>
        <p className="text-sm tabular-nums text-ink-3">
          {queue.length} left · {done} done
        </p>
      </div>

      <div className="panel mt-2 p-6 sm:p-8">
        <p className="max-w-3xl text-2xl font-medium leading-[1.35] text-ink">{card.front}</p>

        {!revealed ? (
          <button
            type="button"
            className="btn btn-primary mt-7"
            onClick={() => setRevealed(true)}
          >
            Show the Mechanism
          </button>
        ) : (
          <div className="anim-rise mt-7 space-y-6 border-t border-rule pt-7">
            <div>
              <p className="label">The mechanism</p>
              <p className="prose-measure mt-1.5 text-[1.0625rem] leading-relaxed text-ink">
                {card.back}
              </p>
            </div>
            {card.trap && (
              <div>
                <p className="label text-warn">What you were tempted to say</p>
                <p className="prose-measure mt-1.5 leading-relaxed text-ink-2">{card.trap}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {revealed && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {GRADES.map((option) => (
            <button
              key={option.grade}
              type="button"
              disabled={busy}
              onClick={() => grade(option.grade)}
              className="panel px-5 py-4 text-left transition-colors duration-130 hover:border-rule-2 hover:bg-raised disabled:opacity-50"
            >
              <span className={`block font-medium ${option.tone}`}>{option.label}</span>
              <span className="mt-0.5 block text-sm text-ink-3">{option.help}</span>
            </button>
          ))}
        </div>
      )}

      {lastInterval && (
        <p className="mt-4 text-sm text-ink-3" role="status" aria-live="polite">
          Last card scheduled in {lastInterval}.
        </p>
      )}
    </div>
  );
}
