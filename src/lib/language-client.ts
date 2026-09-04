"use client";

import { DEFAULT_LANGUAGE_CODE, isSupportedLanguageCode } from "./languages";

const KEY = "eb-language";

/** The response language the learner picked, read fresh at call time — no
 * cross-component state to keep in sync, just one source of truth. */
export function getStoredLanguage(): string {
  try {
    const stored = localStorage.getItem(KEY);
    return stored && isSupportedLanguageCode(stored) ? stored : DEFAULT_LANGUAGE_CODE;
  } catch {
    return DEFAULT_LANGUAGE_CODE;
  }
}

export function setStoredLanguage(code: string): void {
  try {
    localStorage.setItem(KEY, code);
  } catch {
    // Private mode or blocked storage: the choice still applies for this visit.
  }
}
