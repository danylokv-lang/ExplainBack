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
    <div className="space-y-10 py-10">
      <header>
        <p className="label">Study cards</p>
        <h1 className="mt-3 text-4xl leading-tight">Written from your own gaps</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-ink-2">
          Every card comes from something a diagnosis actually found in your explanation.
          None of them can be answered by reciting a definition — that is the point.
        </p>
      </header>

      <CardReview cards={due} />

      {all.length > 0 && (
        <>
          <div className="ruler" />
          <section aria-labelledby="deck-heading">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="deck-heading" className="text-2xl leading-tight">
                The whole deck
              </h2>
              <p className="label tabular-nums">
                {all.length} {plural(all.length, "card")}
              </p>
            </div>
            <ul className="mt-4 divide-y divide-rule border border-rule bg-surface">
              {all.map((card) => (
                <li key={card.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="label">{card.topic}</span>
                    {card.gapType && (
                      <span className="border border-rule px-1.5 font-mono text-[0.625rem] tracking-[0.12em] text-ink-3">
                        {GAP_META[card.gapType].code}
                      </span>
                    )}
                    <span className="label ml-auto tabular-nums">
                      due {formatDate(card.dueAt)} · {card.reps} {plural(card.reps, "rep")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink">{card.front}</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {all.length === 0 && (
        <div className="panel p-6">
          <p className="text-sm leading-relaxed text-ink-2">
            Your deck is empty. Finish a session and choose{" "}
            <em className="not-italic text-ink">Generate study cards</em> on the diagnosis.
          </p>
          <Link href="/app/practice" className="btn btn-primary mt-4">
            Start a session
          </Link>
        </div>
      )}
    </div>
  );
}
