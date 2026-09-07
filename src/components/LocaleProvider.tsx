"use client";

import { createContext, useContext } from "react";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { UiLocale } from "@/lib/i18n/locale";

const LocaleContext = createContext<{ locale: UiLocale; t: Dictionary } | null>(null);

/**
 * Feeds the interface-language dictionary to every client component in the
 * authenticated app, however deeply it's nested — server pages resolve their
 * own copy of `t` directly (they have the cookie), this context exists for
 * client components that don't.
 */
export function LocaleProvider({
  locale,
  t,
  children,
}: {
  locale: UiLocale;
  t: Dictionary;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={{ locale, t }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale() called outside <LocaleProvider>.");
  return ctx;
}
