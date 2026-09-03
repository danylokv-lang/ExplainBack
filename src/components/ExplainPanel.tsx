"use client";

import { useCallback, useEffect, useRef } from "react";
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

  // An explanation typed from memory is not something to lose to a stray
  // back gesture.
  useEffect(() => {
    if (chars === 0) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [chars]);

  return (
    <section aria-labelledby="explain-heading" className="py-12">
      <p className="label">
        {isRetry ? `Step 4 — attempt ${attemptIndex}` : "Step 1 — your explanation"}
      </p>
      <h1 id="explain-heading" className="display mt-2 text-4xl sm:text-5xl">
        {isRetry ? "Explain It Again" : topic}
      </h1>
      <p className="prose-measure mt-4 text-lg leading-relaxed text-ink-2">
        {isRetry
          ? "Same topic, second pass. Keep the repair questions in mind — we score this against your first attempt."
          : brief}
      </p>

      <div className="mt-9 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <label htmlFor="explanation" className="label">
            Write it in your own words
          </label>
          <textarea
            id="explanation"
            ref={areaRef}
            name="explanation"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            rows={13}
            maxLength={6000}
            spellCheck
            autoComplete="off"
            placeholder="Pretend you are explaining this to a friend who has never met the topic. Start anywhere…"
            className="panel mt-2 block w-full resize-y p-5 text-[1.0625rem] leading-[1.7] text-ink placeholder:text-ink-3"
          />

          {speech.interim && (
            <p className="mt-2 text-[0.9375rem] italic text-ink-3" aria-live="polite">
              {speech.interim}…
            </p>
          )}
          {speech.error && (
            <p className="mt-2 text-[0.9375rem] text-bad" role="status">
              {speech.error}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-primary" onClick={onSubmit} disabled={!ready}>
              {submitting ? "Diagnosing…" : "Find My Gaps"}
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
                {speech.recording ? "Stop Recording" : "Explain Out Loud"}
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
                Load a Sample Answer
              </button>
            )}
          </div>

          <p className="mt-3 text-sm tabular-nums text-ink-3" aria-live="polite">
            {words} {plural(words, "word")}
            {chars < MIN_CHARS
              ? ` · ${MIN_CHARS - chars} more ${plural(MIN_CHARS - chars, "character")} before we can diagnose`
              : " · ready to diagnose"}
          </p>

          {error && (
            <p
              className="mt-5 border-l-[3px] border-bad bg-bad-bg p-4 leading-relaxed text-ink"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>

        <aside className="space-y-7 lg:border-l lg:border-rule lg:pl-7">
          {questions && questions.length > 0 && (
            <div>
              <h2 className="text-[0.9375rem] font-medium text-ink">Your repair questions</h2>
              <ul className="mt-3 space-y-3.5">
                {questions.map((question) => (
                  <li
                    key={question.id}
                    className="border-l-2 border-accent pl-3.5 text-[0.9375rem] leading-relaxed text-ink-2"
                  >
                    {question.question}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h2 className="text-[0.9375rem] font-medium text-ink">House rules</h2>
            <ul className="mt-3 space-y-2.5 text-[0.9375rem] leading-relaxed text-ink-2">
              <li>No searching, no notes.</li>
              <li>Explain how it works, don&rsquo;t list the terms.</li>
              <li>If you get stuck, say so — that is diagnostic too.</li>
            </ul>
          </div>

          <button type="button" className="btn btn-ghost w-full" onClick={onBack}>
            Pick Another Topic
          </button>
        </aside>
      </div>
    </section>
  );
}
