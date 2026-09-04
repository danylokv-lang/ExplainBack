/** Response language: independent from the (fixed English) UI chrome. */
export interface Language {
  code: string;
  /** English name, used in prompts sent to the model */
  label: string;
  /** Native name, shown in the picker so it's recognisable at a glance */
  endonym: string;
}

export const LANGUAGES: Language[] = [
  { code: "en", label: "English", endonym: "English" },
  { code: "uk", label: "Ukrainian", endonym: "Українська" },
  { code: "es", label: "Spanish", endonym: "Español" },
  { code: "fr", label: "French", endonym: "Français" },
  { code: "de", label: "German", endonym: "Deutsch" },
  { code: "pt", label: "Portuguese", endonym: "Português" },
  { code: "it", label: "Italian", endonym: "Italiano" },
  { code: "pl", label: "Polish", endonym: "Polski" },
  { code: "nl", label: "Dutch", endonym: "Nederlands" },
  { code: "tr", label: "Turkish", endonym: "Türkçe" },
  { code: "ar", label: "Arabic", endonym: "العربية" },
  { code: "hi", label: "Hindi", endonym: "हिन्दी" },
  { code: "zh", label: "Chinese (Simplified)", endonym: "简体中文" },
  { code: "ja", label: "Japanese", endonym: "日本語" },
  { code: "ko", label: "Korean", endonym: "한국어" },
];

export const DEFAULT_LANGUAGE_CODE = "en";

/** English name the model prompts key off, e.g. "Ukrainian". Falls back to English. */
export function languageLabel(code: string | null | undefined): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? "English";
}

export function isSupportedLanguageCode(code: string): boolean {
  return LANGUAGES.some((l) => l.code === code);
}
