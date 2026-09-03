"use client";

import { useCallback, useRef } from "react";
import { plural } from "@/lib/plural";
import { useSpeech } from "@/lib/useSpeech";
import type { RepairQuestion } from "@/lib/types";

const MIN_CHARS = 40;

interface Props {
  topic: string;
  brief: string;
  attemptIndex: number;
  value: string;
  sample?: string;
  questions?: RepairQuestion[];
  submitting: boolean;
  error: string | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export function ExplainPanel({
  topic,
  brief,
  attemptIndex,
  value,
  sample,
  questions,
  submitting,
  error,
  onChange,
  onSubmit,
  onBack,
}: Props) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const appendSpeech = useCallback(
    (chunk: string) => {
      if (!chunk) return;
      onChange(value ? `${value.replace(/\s+$/, "")} ${chunk}` : chunk);
    },
    [onChange, value],
  );
  const speech = useSpeech(appendSpeech);

  const chars = value.trim().length;
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  const ready = chars >= MIN_CHARS && !submitting;
  const isRetry = attemptIndex > 1;

  return (
    <section aria-labelledby="explain-heading" className="py-10">
      <p className="label">
        {isRetry ? `Step 4 — attempt ${attemptIndex}` : "Step 1 — your explanation"}
      </p>
      <h1 id="explain-heading" className="mt-3 text-4xl leading-tight sm:text-[2.75rem]">
        {isRetry ? "Explain it again, gaps in hand" : topic}
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_268px]">
        <div className="min-w-0">
          <label htmlFor="explanation" className="label">
            In your own words
          </label>
          <textarea
            id="explanation"
            ref={areaRef}
            name="explanation"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            rows={12}
            maxLength={6000}
            spellCheck
            autoComplete="off"
            placeholder="Pretend you are explaining this to a friend who has never met the topic. Start anywhere…"
            className="panel mt-3 block w-full resize-y p-5 font-display text-lg leading-[1.7] text-ink placeholder:font-sans placeholder:text-[0.9375rem] placeholder:leading-relaxed placeholder:text-ink-3"
          />

          {speech.interim && (
            <p className="mt-2 font-display text-sm italic text-ink-3" aria-live="polite">
              {speech.interim}…
            </p>
          )}
          {speech.error && (
            <p className="mt-2 text-sm text-bad" role="status">
              {speech.error}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-primary" onClick={onSubmit} disabled={!ready}>
              {submitting ? "Diagnosing…" : "Find my gaps"}
            </button>

            {speech.supported && (
              <button
                type="button"
                onClick={speech.toggle}
                aria-pressed={speech.recording}
                className="btn btn-ghost"
              >
                <span
                  aria-hidden="true"
                  className={`inline-block h-2 w-2 rounded-full ${
                    speech.recording ? "anim-rec bg-bad" : "bg-ink-3"
                  }`}
                />
                {speech.recording ? "Stop recording" : "Explain out loud"}
              </button>
            )}

            {sample && !isRetry && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  onChange(sample);
                  areaRef.current?.focus();
                }}
              >
                Load a sample answer
              </button>
            )}

            <span className="label ml-auto tabular-nums">
              {words} {plural(words, "word")} · {chars} {plural(chars, "char")}
            </span>
          </div>

          <p className="mt-2 text-sm text-ink-3" aria-live="polite">
            {chars < MIN_CHARS
              ? `${MIN_CHARS - chars} more ${plural(MIN_CHARS - chars, "character")} to go — the diagnosis needs connected prose.`
              : "Ready to diagnose."}
          </p>

          {error && (
            <p
              className="mt-4 border-l-2 border-bad bg-bad-bg px-4 py-3 text-sm text-ink"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>

        <aside className="space-y-6 lg:border-l lg:border-rule lg:pl-6">
          <div>
            <h2 className="label">What counts as explained</h2>
            <p className="mt-2 font-display text-[0.9375rem] leading-relaxed text-ink-2">
              {brief}
            </p>
          </div>

          {questions && questions.length > 0 && (
            <div>
              <h2 className="label">Questions from your repair lesson</h2>
              <ul className="mt-2 space-y-3">
                {questions.map((question) => (
                  <li
                    key={question.id}
                    className="border-l-2 border-accent pl-3 font-display text-sm leading-relaxed text-ink-2"
                  >
                    {question.question}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h2 className="label">House rules</h2>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed text-ink-2">
              <li>No searching, no peeking at notes.</li>
              <li>Explain the mechanism, do not list the terms.</li>
              <li>If you get stuck, write that down — it is diagnostic too.</li>
            </ul>
          </div>

          <button type="button" className="btn btn-ghost w-full" onClick={onBack}>
            Pick another topic
          </button>
        </aside>
      </div>
    </section>
  );
}
