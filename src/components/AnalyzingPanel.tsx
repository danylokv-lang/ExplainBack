"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "Reading your explanation literally",
  "Matching it against the reference map",
  "Classifying the kinds of gap",
  "Writing the Socratic questions",
];

export function AnalyzingPanel({ topic }: { topic: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }, 1700);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section aria-labelledby="analyzing-heading" aria-busy="true" className="py-24">
      <p className="label">Step 2 — diagnosis</p>
      <h1 id="analyzing-heading" className="display mt-2 text-4xl">
        Diagnosing…
      </h1>
      <p className="mt-3 text-lg text-ink-2">{topic}</p>

      <div className="mt-9 h-0.5 w-full max-w-lg overflow-hidden bg-sunken">
        <div className="anim-sweep h-full w-1/4 bg-accent" />
      </div>

      <ol className="mt-9 space-y-3.5" aria-live="polite">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={`flex items-baseline gap-3 transition-colors duration-200 ${
              index <= step ? "text-ink" : "text-ink-3"
            }`}
          >
            <span aria-hidden="true" className="code">
              {index < step ? "✓" : index === step ? "▸" : "·"}
            </span>
            {label}
          </li>
        ))}
      </ol>
    </section>
  );
}
