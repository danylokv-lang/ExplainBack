# ExplainBack

**You don't ask the AI to explain it. You explain it.**

ExplainBack diagnoses the *illusion of understanding* — the state where a student
confidently uses the right terminology while holding none of the mechanism behind it.
The learner explains a topic from memory, in their own words, by typing or out loud. The
system compares that explanation against a reference concept map, classifies the gaps it
finds, and — instead of lecturing — asks the Socratic questions that let the learner find
those gaps themselves.

The Feynman technique, closed into a loop:
**explain → diagnose → repair lesson → explain again → compare.**

---

## Running it

```bash
npm install
```

Storage is Cloudflare D1 (SQLite, managed at the edge — see [Deploying](#deploying-to-cloudflare)
below for first-time setup: creating the D1 database and applying the schema). Once that
one-time setup is done, local development is just:

```bash
npm run dev
```

`next.config.ts` calls `initOpenNextCloudflareForDev()`, which proxies D1 (and any other
Cloudflare bindings) into the plain `next dev` server via a local wrangler-managed instance
— no separate `wrangler dev` process needed for everyday work.

For local model calls, put your key in `.dev.vars` (gitignored — this is wrangler's local
equivalent of `.env.local`):

```
ANTHROPIC_API_KEY=sk-ant-...
```

Open <http://localhost:3000>, create an account, and start a session.

Four curated topics (cellular respiration, recursion, Ohm's law, supply and demand) ship
with their concept maps already built, so they open instantly and without a model call.
Any other topic gets its map generated on the spot.

### Environment

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Required for diagnosis, map generation and card writing. Set via `.dev.vars` locally, `wrangler secret put` in production. |
| `EXPLAINBACK_MODEL` | Engine model. Defaults to `claude-haiku-4-5`, which keeps a full loop inside a few seconds. Set `claude-sonnet-5` for a deeper read of the mechanism. |

---

## Deploying to Cloudflare

One-time setup:

```bash
npx wrangler d1 create explainback
```

Copy the `database_id` it prints into `wrangler.jsonc` (`d1_databases[0].database_id`), then
apply the schema to both the local dev database and the real one:

```bash
npm run cf:migrate:local
npm run cf:migrate:remote
```

Set the model key as a Worker secret (prompts for the value, never touches a file):

```bash
npx wrangler secret put ANTHROPIC_API_KEY
```

Then, and on every subsequent deploy:

```bash
npm run cf:deploy
```

This runs `opennextjs-cloudflare build` (compiles the Next.js app into a Cloudflare Worker
via [OpenNext](https://opennext.js.org/cloudflare)) followed by `wrangler deploy`. Whenever
`wrangler.jsonc`'s bindings change, regenerate the local type declarations with
`npm run cf:types`.

---

## How it works

### 1. The concept map is a mechanism, not a syllabus

Each topic is represented as a graph of 5–8 concepts and the causal links between them
(`causes`, `requires`, `produces`, `enables`). The load-bearing field on every node is
**`mechanism`**: the specific working principle somebody with genuine understanding cannot
help saying.

```jsonc
{
  "id": "oxygen",
  "label": "Oxygen",
  "mechanism": "Oxygen gives the cell nothing — it takes the spent electrons away at the
                end of the chain; without it the chain backs up and stalls, and the Krebs
                cycle stalls with it.",
  "misconception": "Oxygen is consumed as fuel, or is itself the source of the energy."
}
```

That field is what makes "the term is present but the understanding is not" a decidable
question rather than a matter of taste.

### 2. Diagnosis is a classifier, not a critic

One model call with **structured outputs** (`output_config.format`) returns a strictly
typed JSON object: a status for every node of the map, the gaps found, and the repair
lesson. Gaps are classified into five kinds:

| Code | Type | What it means |
|---|---|---|
| `SURF` | `SURFACE_ONLY` | The term is used correctly; the mechanism marker is absent. The primary target. |
| `MISS` | `MISSING_CONCEPT` | A load-bearing node never appeared at all. |
| `CAUS` | `WRONG_CAUSALITY` | A map edge is reversed, or an effect is presented as a cause. |
| `CORR` | `CORRELATION_AS_CAUSATION` | Adjacency or simultaneity presented as causation. |
| `GENL` | `OVERGENERALIZATION` | A rule stretched past the conditions that make it true. |

Every gap must rest on a **verbatim quote** from the learner's text and must point at a
specific node or edge of the map.

### 3. Two numbers, and the distance between them

- **Map coverage** is computed deterministically from the assigned node statuses — not
  from the model's own estimate — so two runs over identical text return the same figure
  and the before/after comparison means something.
- **Mechanism depth** scores how far the text rests on *why it works* rather than on what
  it is called.

High coverage with low depth is the illusion of understanding, made into a number. The
interface calls that spread out explicitly when it appears.

### 4. The repair lesson withholds the answer

One to three Socratic questions — a thought experiment or an edge case that makes the gap
palpable. The hint is behind a click; the answer is deliberately absent, because supplying
it ends the loop.

> "Imagine a hole opens in the inner mitochondrial membrane and protons pass freely both
> ways. The chain runs, oxygen is there, fuel is there — why is there still no ATP?"

### 5. Second attempt, measured

The retry is diagnosed from scratch, then cross-checked against the first attempt's gaps:
`4 of 5 gaps closed`, coverage `56% → 100%`, depth `18% → 61%`.

### 6. Study cards written from the learner's own gaps

Any finished session can be turned into study cards. Each card is built so a memorised
definition cannot answer it, and each names the plausible wrong answer it exists to
disarm. Reviews run on a trimmed SM-2 schedule with three grades.

---

## Architecture

```
src/
├─ app/
│  ├─ page.tsx                   Landing page
│  ├─ (auth)/login, signup       Sign in / sign up
│  ├─ app/                       Authenticated area
│  │  ├─ page.tsx                Dashboard
│  │  ├─ practice/               The explain → diagnose → repair loop
│  │  ├─ cards/                  Spaced-repetition review
│  │  ├─ maps/                   Reference concept map library
│  │  └─ history/                Past sessions, with the original wording kept
│  └─ api/
│     ├─ auth/{signup,login,logout}
│     ├─ concept-map             Generates or serves a reference map
│     ├─ analyze                 Diagnosis + repair lesson in one call
│     ├─ runs                    Session records
│     └─ cards, cards/review     Card generation and scheduling
├─ components/                   UI, including the SVG concept graph
└─ lib/
   ├─ anthropic.ts               Client, structured outputs, error handling
   ├─ prompts.ts                 Map, diagnosis and card prompts
   ├─ schemas.ts                 JSON Schemas for every model response
   ├─ validate.ts                Sanitisation + deterministic coverage
   ├─ layout.ts                  Layered graph layout, cycle-safe
   ├─ db.ts                      D1 (Cloudflare's SQLite) queries, all async
   ├─ auth.ts                    Web Crypto PBKDF2 hashing, session cookies
   └─ srs.ts                     Review scheduling
data/topics.json                 Four curated concept maps
```

### The graph

The layout is written by hand rather than pulled from a library: back edges are removed by
a depth-first pass, layers come from Kahn's algorithm, and nodes are ordered inside a layer
by the barycentre of their predecessors. That matters because real maps contain cycles —
Ohm's law includes `current → heating → resistance → current`, and the cycle is part of
what the learner is supposed to understand.

Relation type is encoded in the stroke pattern; node state in colour. Nothing on the page
is coloured decoratively — chroma means diagnosis.

### Design

Light and dark themes are token-driven, with a three-way selector (light / dark / follow
the system) that applies before first paint.

Two rules keep the interface readable. **Legibility first:** body copy sits at 16px with a
1.6 line height, secondary text never drops below 15px, and every text colour clears WCAG
AA against its own background — the contrast ratio of each ink token is recorded next to
it in `globals.css` so a future edit cannot quietly reintroduce grey-on-grey. Plus Jakarta
Sans carries display type (headings, big numbers), Inter carries the interface and all
running text, and IBM Plex Mono is limited to short codes and counters. **Colour means
something:** panels, buttons and chips are rounded with real elevation, but chroma itself
is reserved for diagnosis state — a green node or an amber bar always means something,
never decoration.

---

## Stack

Next.js 15 (App Router) · React 19 · Tailwind CSS v4 · TypeScript ·
`@anthropic-ai/sdk` with structured outputs · Cloudflare Workers + D1 via
[OpenNext](https://opennext.js.org/cloudflare) · Web Crypto for password hashing (portable
between Node and Workers) · Web Speech API for voice input · hand-rolled SVG graph, no
charting library.

---

## MVP limits

- Voice input works where the Web Speech API exists (Chrome, Safari). Elsewhere the
  button is hidden and typing remains the primary path.
- Comparison is always against the first attempt of a session, not the previous one.
- There is no password reset flow.
- Password hashing is PBKDF2-SHA256 at 100,000 iterations — Cloudflare Workers' hard cap
  on `crypto.subtle`'s PBKDF2, and the reason it's not scrypt or a higher iteration count.
