import { cookies } from "next/headers";

export type UiLocale = "en" | "uk";
export const UI_LOCALES: UiLocale[] = ["en", "uk"];
export const LOCALE_COOKIE = "eb-locale";
const DEFAULT_LOCALE: UiLocale = "en";

export function isUiLocale(value: string | undefined | null): value is UiLocale {
  return value === "en" || value === "uk";
}

/**
 * The interface's own display language — separate from the language the AI
 * answers in. Read server-side from a cookie so pages render already
 * translated on first paint, no client-side flash of the wrong language.
 */
export async function getLocale(): Promise<UiLocale> {
  const jar = await cookies();
  const stored = jar.get(LOCALE_COOKIE)?.value;
  return isUiLocale(stored) ? stored : DEFAULT_LOCALE;
}
