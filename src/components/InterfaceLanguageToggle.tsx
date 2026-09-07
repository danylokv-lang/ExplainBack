"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale } from "./LocaleProvider";
import type { UiLocale } from "@/lib/i18n/locale";

const OPTIONS: { value: UiLocale; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "uk", label: "UK" },
];

/**
 * Switches the app's own interface text — nav labels, buttons, headings.
 * Unrelated to the response-language picker in Practice, which controls
 * what language the AI writes its diagnosis in.
 */
export function InterfaceLanguageToggle() {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function choose(next: UiLocale) {
    if (next === locale || pending) return;
    setPending(true);
    try {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={t.shell.interfaceLanguage}
      className="flex gap-0.5 rounded-xl border border-rule bg-sunken p-0.5"
    >
      {OPTIONS.map((option) => {
        const active = locale === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={pending}
            onClick={() => choose(option.value)}
            className={`rounded-lg px-2.5 py-1.5 text-sm font-medium leading-none transition-colors duration-130 disabled:cursor-wait ${
              active ? "bg-surface text-ink shadow-sm" : "text-ink-2 hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
