"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "./LocaleProvider";
import { describeInterval, type Grade } from "@/lib/srs";
import type { StudyCard } from "@/lib/types";

const GRADE_STYLE: Record<Grade, { tone: string; ring: string }> = {
  again: { tone: "text-bad", ring: "hover:border-bad/40 hover:bg-bad-bg" },
  good: { tone: "text-ink", ring: "hover:border-accent/40 hover:bg-accent-bg" },
  easy: { tone: "text-ok", ring: "hover:border-ok/40 hover:bg-ok-bg" },
};

export function CardReview({ cards }: { cards: StudyCard[] }) {
  const { t } = useLocale();
  const router = useRouter();
  const [queue, setQueue] = useState(cards);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);
  const [busy, setBusy] = useState(false);
  const [lastInterval, setLastInterval] = useState<string | null>(null);

  const GRADES: { grade: Grade; label: string; help: string }[] = [
    { grade: "again", label: t.cards.review.gradeAgain, help: t.cards.review.gradeAgainHelp },
    { grade: "good", label: t.cards.review.gradeGood, help: t.cards.review.gradeGoodHelp },
    { grade: "easy", label: t.cards.review.gradeEasy, help: t.cards.review.gradeEasyHelp },
  ];

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
          {done === 0 ? t.cards.review.nothingDue : t.cards.review.deckClear(done)}
        </h2>
        <p className="prose-measure mt-3 leading-relaxed text-ink-2">{t.cards.review.nothingDueBody}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/app/practice" className="btn btn-primary">
            {t.cards.startSession}
          </Link>
          <Link href="/app" className="btn btn-ghost">
            {t.cards.review.backToOverview}
          </Link>
        </div>
      </div>
    );
  }

  const total = queue.length + done;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="chip bg-accent-bg text-accent">
          {card.topic}
          {card.gapType && ` · ${t.gapTypes[card.gapType].label}`}
        </span>
        <p className="text-sm tabular-nums text-ink-3">{t.cards.review.leftDone(queue.length, done)}</p>
      </div>

      <div
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t.cards.review.deckProgress}
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sunken"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="panel mt-4 p-6 sm:p-8">
        <p className="max-w-3xl text-2xl font-medium leading-[1.35] text-ink">{card.front}</p>

        {!revealed ? (
          <button
            type="button"
            className="btn btn-primary mt-7"
            onClick={() => setRevealed(true)}
          >
            {t.cards.review.showMechanism}
          </button>
        ) : (
          <div className="anim-rise mt-7 space-y-6 border-t border-rule pt-7">
            <div>
              <p className="label">{t.cards.review.mechanismLabel}</p>
              <p className="prose-measure mt-1.5 text-[1.0625rem] leading-relaxed text-ink">
                {card.back}
              </p>
            </div>
            {card.trap && (
              <div>
                <p className="label text-warn">{t.cards.review.trapLabel}</p>
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
              className={`panel card-hover px-5 py-4 text-left disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm ${GRADE_STYLE[option.grade].ring}`}
            >
              <span className={`block font-medium ${GRADE_STYLE[option.grade].tone}`}>{option.label}</span>
              <span className="mt-0.5 block text-sm text-ink-3">{option.help}</span>
            </button>
          ))}
        </div>
      )}

      {lastInterval && (
        <p className="mt-4 text-sm text-ink-3" role="status" aria-live="polite">
          {t.cards.review.lastScheduled(lastInterval)}
        </p>
      )}
    </div>
  );
}
