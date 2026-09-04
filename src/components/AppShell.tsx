"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { Wordmark } from "./Wordmark";
import {
  ClockIcon,
  CloseIcon,
  HomeIcon,
  LayersIcon,
  MapIcon,
  MenuIcon,
  PencilIcon,
} from "./icons";
import type { SessionUser } from "@/lib/auth";

const NAV = [
  { href: "/app", label: "Overview", icon: HomeIcon },
  { href: "/app/practice", label: "Practice", icon: PencilIcon },
  { href: "/app/cards", label: "Study cards", icon: LayersIcon },
  { href: "/app/maps", label: "Map library", icon: MapIcon },
  { href: "/app/history", label: "History", icon: ClockIcon },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

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
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-30 focus:rounded-lg focus:border focus:border-rule focus:bg-surface focus:px-4 focus:py-2"
      >
        Skip to content
      </a>

      <aside className="border-b border-rule bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4 px-5 py-4 lg:block lg:px-6 lg:py-7">
          <Wordmark href="/app" />
          <button
            type="button"
            className="btn btn-ghost h-9 w-9 p-0 lg:hidden"
            aria-expanded={open}
            aria-controls="app-nav"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>

        <div
          id="app-nav"
          className={`${open ? "block" : "hidden"} border-t border-rule px-4 pb-5 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:border-t-0 lg:px-4 lg:pb-7`}
        >
          <nav aria-label="Sections" className="mt-4 lg:mt-2">
            <ul className="space-y-1">
              {NAV.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-medium transition-colors duration-130 ${
                        active
                          ? "bg-accent-bg text-accent"
                          : "text-ink-2 hover:bg-sunken hover:text-ink"
                      }`}
                    >
                      <Icon className="h-[1.15rem] w-[1.15rem] shrink-0" />
                      {item.label}
                      {item.href === "/app/cards" && dueCards > 0 && (
                        <span className="chip ml-auto bg-warn-bg text-warn">{dueCards}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-8 border-t border-rule pt-5 lg:mt-auto">
            <div className="flex items-center gap-3 rounded-xl p-2">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-ink"
              >
                {initials(user.name) || "U"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{user.name}</p>
                <p className="truncate text-xs text-ink-3">{user.email}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 px-2">
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
