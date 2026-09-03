"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { Wordmark } from "./Wordmark";
import type { SessionUser } from "@/lib/auth";

const NAV = [
  { href: "/app", label: "Overview" },
  { href: "/app/practice", label: "Practice" },
  { href: "/app/cards", label: "Study cards" },
  { href: "/app/maps", label: "Map library" },
  { href: "/app/history", label: "History" },
];

export function AppShell({
  user,
  dueCards,
  children,
}: {
  user: SessionUser;
  dueCards: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-30 focus:border focus:border-rule focus:bg-surface focus:px-4 focus:py-2"
      >
        Skip to content
      </a>

      <aside className="border-b border-rule bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4 px-5 py-4 lg:block lg:px-6 lg:py-7">
          <Wordmark href="/app" />
          <button
            type="button"
            className="btn btn-ghost px-3.5 py-2 text-sm lg:hidden"
            aria-expanded={open}
            aria-controls="app-nav"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>

        <div
          id="app-nav"
          className={`${open ? "block" : "hidden"} border-t border-rule px-5 pb-5 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:border-t-0 lg:px-6 lg:pb-7`}
        >
          <nav aria-label="Sections" className="mt-4 lg:mt-3">
            <ul className="space-y-0.5">
              {NAV.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 border-l-2 py-2.5 pl-3.5 pr-2 transition-colors duration-130 ${
                        active
                          ? "border-l-accent bg-raised font-medium text-ink"
                          : "border-l-transparent text-ink-2 hover:border-l-rule-2 hover:text-ink"
                      }`}
                    >
                      {item.label}
                      {item.href === "/app/cards" && dueCards > 0 && (
                        <span className="code ml-auto border border-rule-2 px-1.5 py-0.5 text-ink-2">
                          {dueCards}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-8 border-t border-rule pt-5 lg:mt-auto">
            <p className="truncate font-medium text-ink">{user.name}</p>
            <p className="truncate text-sm text-ink-3">{user.email}</p>
            <div className="mt-4 flex items-center gap-3">
              <ThemeToggle />
              <button
                type="button"
                onClick={signOut}
                className="btn btn-ghost ml-auto px-3 py-1.5 text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main
        id="main"
        className="min-w-0 px-5 pb-24 sm:px-8 lg:px-12"
        style={{ paddingBottom: "max(6rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
