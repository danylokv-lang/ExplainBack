"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const OPTIONS: { value: Theme; label: string; glyph: string }[] = [
  { value: "light", label: "Light", glyph: "☀" },
  { value: "dark", label: "Dark", glyph: "☾" },
  { value: "system", label: "System", glyph: "◐" },
];

function apply(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("eb-theme");
    setTheme(stored === "dark" || stored === "light" ? stored : "system");
    setReady(true);
  }, []);

  const choose = (next: Theme) => {
    setTheme(next);
    apply(next);
    try {
      if (next === "system") localStorage.removeItem("eb-theme");
      else localStorage.setItem("eb-theme", next);
    } catch {
      // Private mode or blocked storage: the choice still applies for this visit.
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="flex border border-rule bg-surface"
    >
      {OPTIONS.map((option) => {
        const active = ready && theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.label}
            title={option.label}
            onClick={() => choose(option.value)}
            className={`px-2 py-1 text-xs leading-none transition-colors duration-130 ${
              active ? "bg-ink text-bg" : "text-ink-3 hover:text-ink"
            }`}
          >
            <span aria-hidden="true">{option.glyph}</span>
          </button>
        );
      })}
    </div>
  );
}
