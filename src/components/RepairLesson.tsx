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
      <h2 id="repair-heading" className="display mt-2 text-3xl">
        Questions, Not a Lecture
      </h2>
      <p className="prose-measure mt-3 leading-relaxed text-ink-2">
        The answer is left out on purpose. Each question is an edge case that makes the gap
        obvious. Sit with it before you open the hint.
      </p>

      <ol className="mt-7 space-y-4">
        {questions.map((question, index) => {
          const gap = gaps.find((candidate) => candidate.id === question.gapId);
          const isOpen = Boolean(open[question.id]);
          const hintId = `hint-${question.id}`;

          return (
            <li key={question.id} className="panel p-5 sm:p-6">
              <div className="flex items-baseline gap-3">
                <span className="code text-ink-3">{String(index + 1).padStart(2, "0")}</span>
                {gap && <span className="text-sm text-ink-3">{GAP_META[gap.type].label}</span>}
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
                {isOpen ? "Hide Hint" : "Show Hint"}
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
