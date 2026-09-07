import Link from "next/link";
import { MetricsStrip } from "@/components/MetricsStrip";
import { SiteHeader } from "@/components/SiteHeader";
import { Wordmark } from "@/components/Wordmark";
import { PRESET_TOPICS, slugify } from "@/lib/store";
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
    body: "Type it or say it out loud. No notes, no multiple choice. Connected prose is the only thing that shows whether the parts are actually joined up.",
  },
  {
    code: "02",
    title: "We check it against a mechanism",
    body: "Not a keyword list. Every concept in the reference map records what someone who understands it would have to say. Your text either says it or it doesn't.",
  },
  {
    code: "03",
    title: "Gaps come back sorted",
    body: "Five kinds, each quoting the sentence it came from. A missing concept and a term used without its mechanism are different problems and need different fixes.",
  },
  {
    code: "04",
    title: "Then you explain it again",
    body: "No lecture — one to three questions that make the gap obvious. Your second attempt is scored against the first, so progress is measured, not felt.",
  },
];

function SectionLabel({ number, children }: { number: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-sm text-ink-3">
      <span className="code text-ink-2">{number}</span>
      <span aria-hidden="true" className="h-px w-6 bg-rule-2" />
      {children}
    </p>
  );
}

export default function LandingPage() {
  return (
    <>
      <SiteHeader />

      <main id="main">
        {/* Hero: the claim on the left, real product output on the right. */}
        <section className="mx-auto w-full max-w-6xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24">
          <div className="grid items-start gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
            <div>
              <p className="text-sm text-ink-3">Turn Your Explanation Into a Knowledge Diagnosis</p>
              <h1 className="display mt-5 text-[2.75rem] sm:text-6xl">
                You don&rsquo;t ask the AI to explain it.
                <br />
                <span className="text-accent">You</span> explain it.
              </h1>
              <p className="mt-7 max-w-xl text-xl leading-[1.6] text-ink-2">
                Recognising a topic feels exactly like understanding it — until you have to
                say it out loud. Explain one from memory and ExplainBack shows you, in your
                own words, where it falls apart.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/signup" className="btn btn-primary">
                  Diagnose Me
                </Link>
                <a href="#method" className="btn btn-ghost">
                  See How It Works
                </a>
              </div>

              <ol className="mt-14 grid max-w-xl grid-cols-2 gap-x-6 gap-y-6 border-t border-rule pt-7 sm:grid-cols-4">
                {[
                  "Explain from memory",
                  "Find your gaps",
                  "Repair one concept",
                  "Explain it again",
                ].map((step, index) => (
                  <li key={step} className="flex flex-col gap-2">
                    <span className="code text-ink-3">{String(index + 1).padStart(2, "0")}</span>
                    <span className="text-sm font-medium leading-snug text-ink">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* A real diagnosis of the sample answer that ships with the app. */}
            <figure className="panel m-0 p-6 sm:p-7">
              <figcaption className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule pb-4">
                <span className="font-medium text-ink">A real diagnosis</span>
                <span className="text-sm text-ink-3">Topic: cellular respiration</span>
              </figcaption>

              <p className="mt-5 text-sm text-ink-3">What the student wrote</p>
              <blockquote className="mt-2 leading-relaxed text-ink-2">
                Cellular respiration is the process where the cell gets energy from glucose.{" "}
                <mark className="bg-bad-bg px-1 text-ink">Glucose goes into the mitochondria</mark>,
                and{" "}
                <mark className="bg-warn-bg px-1 text-ink">
                  the Krebs cycle happens there, which produces a lot of ATP
                </mark>. Mitochondria are called the powerhouse of the cell…{" "}
                <mark className="bg-warn-bg px-1 text-ink">
                  The more mitochondria a cell has, the more energy it has.
                </mark>
              </blockquote>

              <div className="mt-7 border-t border-rule pt-6">
                <MetricsStrip
                  coverage={SHOWCASE_DIAGNOSIS.coverage}
                  depth={SHOWCASE_DIAGNOSIS.depth}
                  gapCount={SHOWCASE_DIAGNOSIS.gaps.length}
                  compact
                  formatSeconds={(ms) => (ms / 1000).toFixed(1)}
                  labels={{
                    conceptCoverage: "Concept coverage",
                    conceptCoverageHint: "How many key ideas you mentioned.",
                    reasoningDepth: "Reasoning depth",
                    reasoningDepthHint: "How well you explained why and how they connect.",
                    illusionHeading: (spread) => `The two numbers are ${spread} points apart.`,
                    illusionBody:
                      "You have the vocabulary and not the machinery. That gap is the illusion of understanding — a topic feels clear until you have to explain it.",
                    gapsFound: (count) => `${count} gap${count === 1 ? "" : "s"} found`,
                    analysedIn: (seconds) => `Analysed in ${seconds} s`,
                  }}
                />
              </div>

              <p className="mt-6 border-t border-rule pt-5 text-xl font-medium leading-snug text-ink">
                {SHOWCASE_DIAGNOSIS.verdict}
              </p>
            </figure>
          </div>
        </section>

        {/* 01 — the problem */}
        <section
          id="problem"
          aria-labelledby="problem-heading"
          className="border-y border-rule bg-sunken/60"
        >
          <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
            <SectionLabel number="01">The problem</SectionLabel>
            <h2 id="problem-heading" className="display mt-5 max-w-3xl text-4xl sm:text-5xl">
              A test measures recognition. Only an explanation measures the joins.
            </h2>

            <div className="mt-12 grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-rule bg-surface p-7 shadow-sm">
                <p className="text-sm text-ink-3">What a test sees</p>
                <p className="mt-4 text-2xl font-medium leading-snug text-ink">
                  &ldquo;The Krebs cycle produces a lot of ATP.&rdquo;
                </p>
                <p className="mt-4 leading-relaxed text-ink-2">
                  Right words, right association, plausible sentence. Any keyword-matching
                  marker gives it full credit — and so does the student&rsquo;s own sense of
                  how revision went.
                </p>
              </div>
              <div className="rounded-2xl border border-accent/30 bg-accent-bg p-7 shadow-sm">
                <p className="text-sm font-semibold text-accent">What understanding requires</p>
                <p className="mt-4 text-2xl font-medium leading-snug text-ink">
                  Electrons stripped onto carriers, then spent pumping protons across a
                  membrane.
                </p>
                <p className="mt-4 leading-relaxed text-ink-2">
                  The cycle&rsquo;s real output is not ATP. You can carry the first sentence
                  for years without noticing the second is missing, because nothing you are
                  ever asked requires it.
                </p>
              </div>
            </div>

            <p className="prose-measure mt-10 text-lg leading-relaxed text-ink-2">
              That distance has a measurable shape: wide coverage of the vocabulary, thin
              depth of mechanism. ExplainBack reports both numbers and names the gap between
              them, because the gap is the diagnosis.
            </p>
          </div>
        </section>

        {/* 02 — method */}
        <section id="method" aria-labelledby="method-heading">
          <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
            <SectionLabel number="02">How it works</SectionLabel>
            <h2 id="method-heading" className="display mt-5 max-w-2xl text-4xl sm:text-5xl">
              Four steps, about a minute each.
            </h2>

            <ol className="mt-12 grid gap-5 md:grid-cols-2">
              {STEPS.map((step) => (
                <li key={step.code} className="panel p-7">
                  <div className="flex items-baseline gap-4">
                    <span className="display text-3xl text-ink-3">{step.code}</span>
                    <h3 className="text-xl font-medium leading-snug text-ink">{step.title}</h3>
                  </div>
                  <p className="mt-4 leading-relaxed text-ink-2">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 03 — taxonomy */}
        <section
          id="taxonomy"
          aria-labelledby="taxonomy-heading"
          className="border-y border-rule bg-sunken/60"
        >
          <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
            <SectionLabel number="03">The five gaps</SectionLabel>
            <h2 id="taxonomy-heading" className="display mt-5 max-w-2xl text-4xl sm:text-5xl">
              Five ways an explanation fails.
            </h2>
            <p className="prose-measure mt-5 text-lg leading-relaxed text-ink-2">
              The model is never asked whether your answer is good. It is asked which of
              these five it is, which concept it breaks, and which sentence of yours proves
              it.
            </p>

            <ul className="mt-12 divide-y divide-rule overflow-hidden rounded-2xl border border-rule bg-surface shadow-sm">
              {TAXONOMY.map((type) => {
                const meta = GAP_META[type];
                return (
                  <li
                    key={type}
                    className="flex flex-col gap-3 p-6 sm:flex-row sm:items-baseline sm:gap-8"
                  >
                    <span className="code chip shrink-0 self-start bg-accent-bg text-accent">
                      {meta.code}
                    </span>
                    <span className="w-56 shrink-0 text-lg font-medium leading-snug text-ink">
                      {meta.label}
                    </span>
                    <span className="leading-relaxed text-ink-2">{meta.blurb}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* 04 — cards */}
        <section aria-labelledby="cards-heading" className="border-y border-rule bg-sunken/60">
          <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
            <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
              <div>
                <SectionLabel number="04">Making it stick</SectionLabel>
                <h2 id="cards-heading" className="display mt-5 text-4xl sm:text-5xl">
                  Cards from your gaps, not from the glossary.
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-ink-2">
                  Any diagnosis can become study cards. Each one is written so a memorised
                  definition cannot answer it, and each names the wrong answer it exists to
                  disarm. They return on a widening schedule until the mechanism does.
                </p>
                <Link href="/signup" className="btn btn-primary mt-9">
                  Build My First Deck
                </Link>
              </div>

              <figure className="panel m-0 p-7 sm:p-8">
                <figcaption className="text-sm text-ink-3">A generated card</figcaption>
                <p className="mt-4 text-2xl font-medium leading-[1.35] text-ink">
                  {SHOWCASE_CARD.front}
                </p>
                <div className="mt-7 border-t border-rule pt-6">
                  <p className="label">The mechanism</p>
                  <p className="mt-1.5 leading-relaxed text-ink-2">{SHOWCASE_CARD.back}</p>
                </div>
                <div className="mt-6">
                  <p className="label text-warn">What you were tempted to say</p>
                  <p className="mt-1.5 leading-relaxed text-ink-2">{SHOWCASE_CARD.trap}</p>
                </div>
              </figure>
            </div>
          </div>
        </section>

        {/* Closing */}
        <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
          <p className="text-sm text-ink-3">Ready to diagnose</p>
          <ul className="mt-5 flex flex-wrap gap-2.5">
            {PRESET_TOPICS.map((preset) => (
              <li key={preset.id}>
                <Link
                  href={`/app/maps/${slugify(preset.topic)}`}
                  className="btn btn-ghost px-4 py-2.5 text-sm"
                >
                  <span className="text-ink-3">{preset.domain}</span>
                  {preset.topic}
                </Link>
              </li>
            ))}
          </ul>

          <h2 className="display mt-16 max-w-3xl text-4xl sm:text-5xl">
            Find out which half of what you know is only recognition.
          </h2>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/signup" className="btn btn-primary">
              Create an Account
            </Link>
            <Link href="/login" className="btn btn-ghost">
              Sign In
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-5 py-9 sm:px-8">
          <Wordmark muted />
          <p className="text-sm text-ink-3">Diagnose the illusion of understanding</p>
          <p className="ml-auto text-sm text-ink-3">Built for the Prometheus Fall Classic</p>
        </div>
      </footer>
    </>
  );
}
