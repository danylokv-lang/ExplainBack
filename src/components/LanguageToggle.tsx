"use client";

import { useEffect, useState } from "react";
import { getStoredLanguage, setStoredLanguage } from "@/lib/language-client";
import { DEFAULT_LANGUAGE_CODE, LANGUAGES } from "@/lib/languages";

/**
 * Picks the language the model answers in — diagnosis, concept maps, study
 * cards. Independent from the app's own interface text, which stays English.
 */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const [code, setCode] = useState(DEFAULT_LANGUAGE_CODE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCode(getStoredLanguage());
    setReady(true);
  }, []);

  return (
    <label className={`flex items-center gap-1.5 ${className}`}>
      <span className="sr-only">Response language</span>
      <select
        value={ready ? code : DEFAULT_LANGUAGE_CODE}
        onChange={(event) => {
          const next = event.target.value;
          setCode(next);
          setStoredLanguage(next);
        }}
        className="w-full rounded-xl border border-rule bg-sunken px-2.5 py-1.5 text-sm text-ink-2 transition-colors duration-130 hover:text-ink focus-visible:text-ink"
      >
        {LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.endonym}
          </option>
        ))}
      </select>
    </label>
  );
}
