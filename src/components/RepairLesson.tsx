"use client";

import { useState } from "react";
import { useLocale } from "./LocaleProvider";
import type { Gap, RepairQuestion } from "@/lib/types";

interface Props {
  questions: RepairQuestion[];
  gaps: Gap[];
}

export function RepairLesson({ questions, gaps }: Props) {
  const { t } = useLocale();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  if (questions.length === 0) return null;

  return (
    <section aria-labelledby="repair-heading">
      <p className="label">{t.diagnosis.repair.step}</p>
      <h2 id="repair-heading" className="display mt-2 text-3xl">
        {t.diagnosis.repair.heading}
      </h2>
      <p className="prose-measure mt-3 leading-relaxed text-ink-2">{t.diagnosis.repair.body}</p>

      <ol className="mt-7 space-y-4">
        {questions.map((question, index) => {
          const gap = gaps.find((candidate) => candidate.id === question.gapId);
          const isOpen = Boolean(open[question.id]);
          const hintId = `hint-${question.id}`;

          return (
            <li key={question.id} className="panel p-5 sm:p-6">
              <div className="flex items-baseline gap-3">
                <span className="code text-ink-3">{String(index + 1).padStart(2, "0")}</span>
                {gap && <span className="text-sm text-ink-3">{t.gapTypes[gap.type].label}</span>}
              </div>

              <p className="mt-3 max-w-3xl text-xl font-medium leading-[1.45] text-ink">
                {question.question}
              </p>

              <button
                type="button"
                className="btn btn-ghost mt-5 px-3.5 py-2 text-sm"
                aria-expanded={isOpen}
                aria-controls={hintId}
                onClick={() =>
                  setOpen((prev) => ({ ...prev, [question.id]: !prev[question.id] }))
                }
              >
                {isOpen ? t.diagnosis.repair.hideHint : t.diagnosis.repair.showHint}
              </button>

              <p
                id={hintId}
                hidden={!isOpen}
                className="anim-rise prose-measure mt-4 border-l-2 border-accent pl-4 leading-relaxed text-ink-2"
              >
                {question.hint}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
