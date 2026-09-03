import Link from "next/link";
import { LandingGraph } from "@/components/LandingGraph";
import { MetricsStrip } from "@/components/MetricsStrip";
import { SiteHeader } from "@/components/SiteHeader";
import { Wordmark } from "@/components/Wordmark";
import { getMap, PRESET_TOPICS, slugify } from "@/lib/store";
import { SHOWCASE_CARD, SHOWCASE_DIAGNOSIS } from "@/lib/showcase";
import { GAP_META, type GapType } from "@/lib/types";

const TAXONOMY: GapType[] = [
  "SURFACE_ONLY",
  "MISSING_CONCEPT",
  "WRONG_CAUSALITY",
  "CORRELATION_AS_CAUSATION",
  "OVERGENERALIZATION",
];

const STEPS = [
  {
    code: "01",
    title: "You explain, from memory",
    body: "Type it or say it out loud. No notes, no search, no multiple choice. The unit of assessment is your own connected prose, because that is the only artefact that shows whether the parts are joined.",
  },
  {
    code: "02",
    title: "It is measured against a mechanism",
    body: "Not against a keyword list. Every concept in the reference map carries a mechanism marker: the specific working principle somebody who understands cannot help saying. Your text either contains it or it does not.",
  },
  {
    code: "03",
    title: "Gaps come back classified",
    body: "Five kinds, each quoting the sentence of yours it came from. A missing concept and a term used without its mechanism are different failures and need different repairs.",
  },
  {
    code: "04",
    title: "Questions, then you explain again",
    body: "No lecture. One to three Socratic questions built as edge cases, then a second attempt scored against the first, so improvement is measured rather than felt.",
  },
];

export default function LandingPage() {
  const map = getMap("Cellular Respiration")!;

  return (
    <>
      <SiteHeader />

      <main id="main">
        {/* Hero: the claim on the left, the actual product output on the right. */}
        <section className="mx-auto w-full max-w-6xl px-5 pb-16 pt-14 sm:px-8 sm:pt-20">
          <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
            <div>
              <p className="label">Feynman technique, instrumented</p>
              <h1 className="mt-5 text-[2.75rem] leading-[1.05] tracking-tight sm:text-6xl">
                You don&apos;t ask the AI to explain it.
                <br />
                <em className="italic">You</em> explain it.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-2">
                Recognising a topic feels identical to understanding it — right up to the
                moment you have to say it out loud. ExplainBack takes your explanation apart
                against a reference map of the mechanism and tells you, with your own words
                quoted back, exactly where it stops holding.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/signup" className="btn btn-primary">
                  Diagnose me
                </Link>
                <a href="#method" className="btn btn-ghost">
                  See how it works
                </a>
              </div>

              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-rule pt-6">
                {[
                  ["5", "gap types"],
                  ["4", "curated maps"],
                  ["∞", "topics of your own"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <dt className="label">{label}</dt>
                    <dd className="mt-1 font-display text-3xl leading-none text-ink">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* A real diagnosis of the sample answer that ships with the app. */}
            <figure className="panel m-0 p-5 sm:p-6">
              <figcaption className="flex items-baseline justify-between gap-3 border-b border-rule pb-3">
                <span className="label">Sample diagnosis</span>
                <span className="label">Cellular respiration</span>
              </figcaption>

              <blockquote className="mt-4 font-display text-[0.9375rem] leading-relaxed text-ink-2">
                Cellular respiration is the process where the cell gets energy from glucose.{" "}
                <mark className="bg-bad-bg px-0.5 text-ink">
                  Glucose goes into the mitochondria
                </mark>
                , and{" "}
                <mark className="bg-warn-bg px-0.5 text-ink">
                  the Krebs cycle happens there, which produces a lot of ATP
                </mark>
                . Mitochondria are called the powerhouse of the cell…{" "}
                <mark className="bg-warn-bg px-0.5 text-ink">
                  The more mitochondria a cell has, the more energy it has.
                </mark>
              </blockquote>

              <div className="mt-6 border-t border-rule pt-5">
                <MetricsStrip
                  coverage={SHOWCASE_DIAGNOSIS.coverage}
                  depth={SHOWCASE_DIAGNOSIS.depth}
                  gapCount={SHOWCASE_DIAGNOSIS.gaps.length}
                  compact
                />
              </div>

              <p className="mt-5 border-t border-rule pt-4 font-display text-lg leading-snug text-ink">
                {SHOWCASE_DIAGNOSIS.verdict}
              </p>
            </figure>
          </div>
        </section>

        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <div className="ruler" />
        </div>

        {/* §01 — the problem */}
        <section
          id="problem"
          aria-labelledby="problem-heading"
          className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8"
        >
          <p className="label">§ 01 — the problem</p>
          <h2 id="problem-heading" className="mt-4 max-w-3xl text-4xl leading-tight sm:text-5xl">
            A quiz measures recognition. Only an explanation measures the joins.
          </h2>

          <div className="mt-10 grid gap-px border border-rule bg-rule sm:grid-cols-2">
            <div className="bg-surface p-6 sm:p-8">
              <p className="label">What a test sees</p>
              <p className="mt-4 font-display text-2xl leading-snug text-ink">
                &ldquo;The Krebs cycle produces a lot of ATP.&rdquo;
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ink-2">
                Correct vocabulary, correct association, plausible sentence. Marked right by
                anything matching on keywords — and by the student&apos;s own sense of how
                well the revision went.
              </p>
            </div>
            <div className="bg-surface p-6 sm:p-8">
              <p className="label text-warn">What the mechanism needs</p>
              <p className="mt-4 font-display text-2xl leading-snug text-ink">
                Electrons, stripped onto carriers, spent pumping protons across a membrane.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ink-2">
                The cycle&apos;s actual output is not ATP. A student can carry the first
                sentence for years without ever noticing the second one is missing, because
                nothing they are asked ever requires it.
              </p>
            </div>
          </div>

          <p className="mt-8 max-w-2xl leading-relaxed text-ink-2">
            That distance has a shape you can measure: broad coverage of the vocabulary,
            thin depth of mechanism. ExplainBack reports both numbers separately and names
            the spread between them, because the spread is the diagnosis.
          </p>
        </section>

        {/* §02 — method */}
        <section
          id="method"
          aria-labelledby="method-heading"
          className="border-y border-rule bg-surface"
        >
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
            <p className="label">§ 02 — the loop</p>
            <h2 id="method-heading" className="mt-4 max-w-2xl text-4xl leading-tight sm:text-5xl">
              Four steps, under a minute each.
            </h2>

            <ol className="mt-12 grid gap-px bg-rule md:grid-cols-2">
              {STEPS.map((step) => (
                <li key={step.code} className="bg-surface p-6 sm:p-8">
                  <div className="flex items-baseline gap-4">
                    <span className="font-display text-4xl leading-none text-ink-3">
                      {step.code}
                    </span>
                    <h3 className="text-2xl leading-tight">{step.title}</h3>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-ink-2">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* §03 — taxonomy */}
        <section
          id="taxonomy"
          aria-labelledby="taxonomy-heading"
          className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8"
        >
          <p className="label">§ 03 — taxonomy</p>
          <h2 id="taxonomy-heading" className="mt-4 max-w-2xl text-4xl leading-tight sm:text-5xl">
            Five ways an explanation fails.
          </h2>
          <p className="mt-5 max-w-2xl leading-relaxed text-ink-2">
            The model is not asked whether your answer is good. It is asked which of these
            five it is, which node of the map it breaks, and which sentence of yours proves
            it. A classifier over a causal graph, not a critic.
          </p>

          <ul className="mt-10 divide-y divide-rule border border-rule bg-surface">
            {TAXONOMY.map((type) => {
              const meta = GAP_META[type];
              return (
                <li
                  key={type}
                  className="flex flex-col gap-2 p-5 sm:flex-row sm:items-baseline sm:gap-8 sm:p-6"
                >
                  <span className="shrink-0 border border-rule-2 px-2 py-1 font-mono text-[0.6875rem] tracking-[0.14em] text-ink-2">
                    {meta.code}
                  </span>
                  <span className="w-52 shrink-0 font-display text-xl leading-tight text-ink">
                    {meta.label}
                  </span>
                  <span className="text-sm leading-relaxed text-ink-2">{meta.blurb}</span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* §04 — the map itself */}
        <section
          aria-labelledby="map-heading"
          className="border-y border-rule bg-surface"
        >
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
            <p className="label">§ 04 — the reference map</p>
            <h2 id="map-heading" className="mt-4 max-w-2xl text-4xl leading-tight sm:text-5xl">
              Your text, drawn onto the mechanism.
            </h2>
            <p className="mt-5 max-w-2xl leading-relaxed text-ink-2">
              Green survived contact with your explanation. Amber is a term with nothing
              behind it. Dashed never appeared. This is the live component, on the sample
              answer above — click a gap or a node.
            </p>

            <div className="mt-10">
              <LandingGraph map={map} diagnosis={SHOWCASE_DIAGNOSIS} />
            </div>
          </div>
        </section>

        {/* §05 — cards */}
        <section
          aria-labelledby="cards-heading"
          className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8"
        >
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
            <div>
              <p className="label">§ 05 — retention</p>
              <h2 id="cards-heading" className="mt-4 text-4xl leading-tight sm:text-5xl">
                Cards written from your gaps, not from the glossary.
              </h2>
              <p className="mt-5 leading-relaxed text-ink-2">
                Each diagnosis can be turned into study cards on the spot. Every card is
                built so a memorised definition cannot answer it, and each one names the
                plausible wrong answer it exists to disarm. They come back on a widening
                schedule until the mechanism does.
              </p>
              <Link href="/signup" className="btn btn-primary mt-8">
                Build my first deck
              </Link>
            </div>

            <figure className="panel m-0 p-6 sm:p-8">
              <figcaption className="label">Generated card</figcaption>
              <p className="mt-4 font-display text-2xl leading-snug text-ink">
                {SHOWCASE_CARD.front}
              </p>
              <div className="mt-6 border-t border-rule pt-5">
                <p className="label">The mechanism</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{SHOWCASE_CARD.back}</p>
              </div>
              <div className="mt-5">
                <p className="label text-warn">What you were tempted to say</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{SHOWCASE_CARD.trap}</p>
              </div>
            </figure>
          </div>
        </section>

        {/* Topics + closing */}
        <section className="border-t border-rule bg-surface">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
            <p className="label">Ready to diagnose</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {PRESET_TOPICS.map((preset) => (
                <li key={preset.id}>
                  <Link
                    href={`/app/maps/${slugify(preset.topic)}`}
                    className="btn btn-ghost px-3.5 py-2 text-xs"
                  >
                    <span className="text-ink-3">{preset.domain}</span>
                    {preset.topic}
                  </Link>
                </li>
              ))}
            </ul>

            <h2 className="mt-14 max-w-3xl text-4xl leading-tight sm:text-5xl">
              Find out which half of what you know is only recognition.
            </h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="btn btn-primary">
                Create an account
              </Link>
              <Link href="/login" className="btn btn-ghost">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-5 py-8 sm:px-8">
          <Wordmark muted />
          <p className="label">Diagnose the illusion of understanding</p>
          <p className="label ml-auto">Built for the Prometheus Fall Classic</p>
        </div>
      </footer>
    </>
  );
}
