"use client";

import { useState } from "react";
import type { PresetTopic } from "@/lib/store";

interface Props {
  presets: PresetTopic[];
  pendingTopic: string | null;
  error: string | null;
  onPick: (topic: string) => void;
}

export function TopicPicker({ presets, pendingTopic, error, onPick }: Props) {
  const [custom, setCustom] = useState("");
  const busy = pendingTopic !== null;

  return (
    <section aria-labelledby="topic-heading" className="py-10">
      <p className="label">Step 0 — pick a topic</p>
      <h1 id="topic-heading" className="mt-3 max-w-2xl text-4xl leading-tight sm:text-5xl">
        Choose something you believe you understand.
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed text-ink-2">
        You will explain it from memory — no notes, no search. That is usually the moment
        it turns out the clarity was a feeling rather than a grasp.
      </p>

      {error && (
        <p
          className="mt-6 border-l-2 border-bad bg-bad-bg px-4 py-3 text-sm text-ink"
          role="alert"
        >
          {error}
        </p>
      )}

      <ul className="mt-9 grid gap-3 sm:grid-cols-2">
        {presets.map((preset) => {
          const isPending = pendingTopic === preset.topic;
          return (
            <li key={preset.id}>
              <button
                type="button"
                onClick={() => onPick(preset.topic)}
                disabled={busy}
                className="panel group flex h-full w-full flex-col items-start p-5 text-left transition-colors duration-130 hover:border-rule-2 hover:bg-raised disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="label">{preset.domain}</span>
                <span className="mt-3 font-display text-2xl leading-snug text-ink">
                  {preset.topic}
                </span>
                <span className="mt-3 text-sm leading-relaxed text-ink-2">{preset.brief}</span>
                <span className="label mt-5 flex w-full items-center justify-between border-t border-rule pt-3">
                  <span className="tabular-nums">
                    {preset.nodeCount} concepts · {preset.edgeCount} links
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-ink-3 transition-transform duration-130 group-hover:translate-x-0.5"
                  >
                    {isPending ? "…" : "→"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="ruler mt-10" />

      <form
        className="mt-8"
        onSubmit={(event) => {
          event.preventDefault();
          const topic = custom.trim();
          if (topic.length >= 2) onPick(topic);
        }}
      >
        <label htmlFor="custom-topic" className="label">
          Or bring your own
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id="custom-topic"
            name="topic"
            type="text"
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            maxLength={120}
            autoComplete="off"
            spellCheck={false}
            placeholder="Photosynthesis, hash tables, the second law of thermodynamics…"
            className="field min-w-0 flex-1"
          />
          <button
            type="submit"
            className="btn btn-primary shrink-0"
            disabled={busy || custom.trim().length < 2}
          >
            {pendingTopic === custom.trim() ? "Building the map…" : "Build the map"}
          </button>
        </div>
        <p className="mt-3 max-w-xl text-sm text-ink-3">
          For a new topic the reference map is generated on the spot, which takes a few
          seconds. Curated topics open instantly.
        </p>
      </form>
    </section>
  );
}
