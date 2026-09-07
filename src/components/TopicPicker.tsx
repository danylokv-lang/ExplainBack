"use client";

import { useState } from "react";
import { LanguageToggle } from "./LanguageToggle";
import { useLocale } from "./LocaleProvider";
import type { PresetTopic } from "@/lib/store";

interface Props {
  presets: PresetTopic[];
  pendingTopic: string | null;
  error: string | null;
  onPick: (topic: string) => void;
}

export function TopicPicker({ presets, pendingTopic, error, onPick }: Props) {
  const { t } = useLocale();
  const [custom, setCustom] = useState("");
  const busy = pendingTopic !== null;

  return (
    <section aria-labelledby="topic-heading" className="py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label">{t.topicPicker.step}</p>
          <h1 id="topic-heading" className="display mt-2 max-w-2xl text-4xl sm:text-5xl">
            {t.topicPicker.heading}
          </h1>
        </div>
        <div className="shrink-0">
          <p className="label mb-1.5 text-right">{t.topicPicker.responseLanguage}</p>
          <LanguageToggle />
        </div>
      </div>
      <p className="prose-measure mt-4 text-lg leading-relaxed text-ink-2">{t.topicPicker.body}</p>

      {error && (
        <p
          className="mt-6 rounded-2xl border border-bad/25 bg-bad-bg p-4 leading-relaxed text-ink"
          role="alert"
        >
          {error}
        </p>
      )}

      <ul className="mt-9 grid gap-4 sm:grid-cols-2">
        {presets.map((preset) => {
          const isPending = pendingTopic === preset.topic;
          return (
            <li key={preset.id}>
              <button
                type="button"
                onClick={() => onPick(preset.topic)}
                disabled={busy}
                className="panel card-hover group flex h-full w-full flex-col items-start p-6 text-left disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
              >
                <span className="text-sm text-ink-3">{preset.domain}</span>
                <span className="display mt-2 text-2xl text-ink">{preset.topic}</span>
                <span className="mt-3 leading-relaxed text-ink-2">{preset.brief}</span>
                <span className="mt-6 flex w-full items-center justify-between border-t border-rule pt-4 text-sm text-ink-3">
                  <span className="tabular-nums">
                    {t.topicPicker.conceptsLinks(preset.nodeCount, preset.edgeCount)}
                  </span>
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-130 group-hover:translate-x-0.5"
                  >
                    {isPending ? "…" : "→"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <form
        className="mt-10 border-t border-rule pt-8"
        onSubmit={(event) => {
          event.preventDefault();
          const topic = custom.trim();
          if (topic.length >= 2) onPick(topic);
        }}
      >
        <label htmlFor="custom-topic" className="label">
          {t.topicPicker.orOwnTopic}
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="custom-topic"
            name="topic"
            type="text"
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            maxLength={120}
            autoComplete="off"
            spellCheck={false}
            placeholder={t.topicPicker.placeholder}
            className="field min-w-0 flex-1"
          />
          <button
            type="submit"
            className="btn btn-primary shrink-0"
            disabled={busy || custom.trim().length < 2}
          >
            {pendingTopic === custom.trim() ? t.topicPicker.building : t.topicPicker.buildMap}
          </button>
        </div>
        <p className="prose-measure mt-3 text-[0.9375rem] text-ink-3">{t.topicPicker.mapHint}</p>
      </form>
    </section>
  );
}
