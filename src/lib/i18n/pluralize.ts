import type { UiLocale } from "./locale";

interface Forms {
  one: string;
  few?: string;
  many: string;
}

const rules: Record<UiLocale, Intl.PluralRules> = {
  en: new Intl.PluralRules("en"),
  uk: new Intl.PluralRules("uk"),
};

/** Picks the right word form for a count, using each locale's real plural rules
 * (English: one/other. Ukrainian: one/few/many — 21 книга, 22 книги, 25 книг). */
export function pluralize(locale: UiLocale, count: number, forms: Forms): string {
  const category = rules[locale].select(count);
  if (category === "one") return forms.one;
  if (category === "few" && forms.few) return forms.few;
  return forms.many;
}

const decimalFormatters: Record<UiLocale, Intl.NumberFormat> = {
  en: new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }),
  uk: new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 1 }),
};

export function formatSeconds(locale: UiLocale, ms: number): string {
  return decimalFormatters[locale].format(ms / 1000);
}

const dateFormatters: Record<UiLocale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
  uk: new Intl.DateTimeFormat("uk-UA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
};

export function formatDate(locale: UiLocale, iso: string): string {
  const parsed = new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`);
  return Number.isNaN(parsed.getTime()) ? iso : dateFormatters[locale].format(parsed);
}
