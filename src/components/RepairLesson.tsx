"use client";

import { useState } from "react";
import type { Gap, RepairQuestion } from "@/lib/types";
import { GAP_META } from "@/lib/types";

interface Props {
  questions: RepairQuestion[];
  gaps: Gap[];
}

export function RepairLesson({ questions, gaps }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  if (questions.length === 0) return null;

  return (
    <section aria-labelledby="repair-heading">
      <p className="label">Step 3 — repair lesson</p>
      <h2 id="repair-heading" className="mt-2 text-3xl leading-tight">
        Questions, not a lecture
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2">
        The answer is deliberately absent. Each question is an edge case that makes the gap
        palpable. Sit with it before you open the hint.
      </p>

      <ol className="mt-6 space-y-4">
        {questions.map((question, index) => {
          const gap = gaps.find((candidate) => candidate.id === question.gapId);
          const isOpen = Boolean(open[question.id]);
          const hintId = `hint-${question.id}`;

          return (
            <li key={question.id} className="panel p-5 sm:p-6">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-2xl leading-none tabular-nums text-ink-3">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {gap && <span className="label">{GAP_META[gap.type].label}</span>}
              </div>

              <p className="mt-3 font-display text-xl leading-snug text-ink sm:text-2xl">
                {question.question}
              </p>

              <button
                type="button"
                className="btn btn-ghost mt-4 px-3 py-1.5 text-xs"
                aria-expanded={isOpen}
                aria-controls={hintId}
                onClick={() =>
                  setOpen((prev) => ({ ...prev, [question.id]: !prev[question.id] }))
                }
              >
                {isOpen ? "Hide hint" : "Show hint"}
              </button>

              <p
                id={hintId}
                hidden={!isOpen}
                className="anim-rise mt-3 border-l-2 border-accent pl-4 text-sm leading-relaxed text-ink-2"
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
