import type { Metadata } from "next";
import Link from "next/link";
import { CardReview } from "@/components/CardReview";
import { currentUser } from "@/lib/auth";
import { listCards, listDueCards } from "@/lib/db";
import { formatDate, plural } from "@/lib/plural";
import { GAP_META } from "@/lib/types";

export const metadata: Metadata = { title: "Study cards" };

export default async function CardsPage() {
  const user = (await currentUser())!;
  const due = listDueCards(user.id);
  const all = listCards(user.id);

  return (
    <div className="space-y-12 py-12">
      <header>
        <p className="label">Study cards</p>
        <h1 className="display mt-2 text-4xl">Written From Your Own Gaps</h1>
        <p className="prose-measure mt-4 text-lg leading-relaxed text-ink-2">
          Every card comes from something a diagnosis found in your explanation. None of
          them can be answered by reciting a definition — that is the point.
        </p>
      </header>

      <CardReview cards={due} />

      {all.length > 0 && (
        <section aria-labelledby="deck-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="deck-heading" className="display text-2xl">
              The Whole Deck
            </h2>
            <p className="text-sm tabular-nums text-ink-3">
              {all.length} {plural(all.length, "card")}
            </p>
          </div>
          <ul className="mt-5 divide-y divide-rule overflow-hidden rounded-2xl border border-rule bg-surface shadow-sm">
            {all.map((card) => (
              <li key={card.id} className="px-5 py-5">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-ink-3">
                  <span>{card.topic}</span>
                  {card.gapType && (
                    <span className="chip code bg-accent-bg text-accent">
                      {GAP_META[card.gapType].code}
                    </span>
                  )}
                  <span className="ml-auto tabular-nums">
                    Due {formatDate(card.dueAt)} · {card.reps} {plural(card.reps, "review")}
                  </span>
                </div>
                <p className="mt-2 leading-relaxed text-ink">{card.front}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {all.length === 0 && (
        <div className="panel p-6">
          <p className="prose-measure leading-relaxed text-ink-2">
            Your deck is empty. Finish a session and choose{" "}
            <span className="font-medium text-ink">Generate Study Cards</span> on the
            diagnosis.
          </p>
          <Link href="/app/practice" className="btn btn-primary mt-5">
            Start a Session
          </Link>
        </div>
      )}
    </div>
  );
}
