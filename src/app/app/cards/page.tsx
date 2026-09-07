import type { Metadata } from "next";
import Link from "next/link";
import { CardReview } from "@/components/CardReview";
import { currentUser } from "@/lib/auth";
import { listCards, listDueCards } from "@/lib/db";
import { dictionary, formatDate, getLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Study cards" };

export default async function CardsPage() {
  const user = (await currentUser())!;
  const locale = await getLocale();
  const t = dictionary(locale);
  const due = await listDueCards(user.id);
  const all = await listCards(user.id);

  return (
    <div className="space-y-12 py-12">
      <header>
        <p className="label">{t.nav.cards}</p>
        <h1 className="display mt-2 text-4xl">{t.cards.heading}</h1>
        <p className="prose-measure mt-4 text-lg leading-relaxed text-ink-2">{t.cards.body}</p>
      </header>

      <CardReview cards={due} />

      {all.length > 0 && (
        <section aria-labelledby="deck-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="deck-heading" className="display text-2xl">
              {t.cards.wholeDeck}
            </h2>
            <p className="text-sm tabular-nums text-ink-3">{t.cards.cardCount(all.length)}</p>
          </div>
          <ul className="mt-5 divide-y divide-rule overflow-hidden rounded-2xl border border-rule bg-surface shadow-sm">
            {all.map((card) => (
              <li key={card.id} className="px-5 py-5">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-ink-3">
                  <span>{card.topic}</span>
                  {card.gapType && (
                    <span className="chip code bg-accent-bg text-accent">
                      {t.gapTypes[card.gapType].label}
                    </span>
                  )}
                  <span className="ml-auto tabular-nums">
                    {t.cards.due(formatDate(locale, card.dueAt), card.reps)}
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
          <p className="prose-measure leading-relaxed text-ink-2">{t.cards.emptyBody}</p>
          <Link href="/app/practice" className="btn btn-primary mt-5">
            {t.cards.startSession}
          </Link>
        </div>
      )}
    </div>
  );
}
