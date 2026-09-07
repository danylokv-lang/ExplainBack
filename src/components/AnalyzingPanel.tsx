"use client";

import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";

export function AnalyzingPanel({ topic }: { topic: string }) {
  const { t } = useLocale();
  const steps = t.analyzing.steps;
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStep((prev) => Math.min(prev + 1, steps.length - 1));
    }, 1700);
    return () => window.clearInterval(timer);
  }, [steps.length]);

  return (
    <section aria-labelledby="analyzing-heading" aria-busy="true" className="py-24">
      <p className="label">{t.analyzing.step}</p>
      <h1 id="analyzing-heading" className="display mt-2 text-4xl">
        {t.analyzing.heading}
      </h1>
      <p className="mt-3 text-lg text-ink-2">{topic}</p>

      <div className="mt-9 h-0.5 w-full max-w-lg overflow-hidden bg-sunken">
        <div className="anim-sweep h-full w-1/4 bg-accent" />
      </div>

      <ol className="mt-9 space-y-3.5" aria-live="polite">
        {steps.map((label, index) => (
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
