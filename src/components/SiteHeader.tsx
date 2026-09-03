import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { Wordmark } from "./Wordmark";
import { currentUser } from "@/lib/auth";

const LINKS = [
  { href: "#problem", label: "The problem" },
  { href: "#method", label: "How it works" },
  { href: "#taxonomy", label: "The five gaps" },
];

export async function SiteHeader() {
  const user = await currentUser();

  return (
    <header className="sticky top-0 z-20 border-b border-rule bg-bg/92 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-5 py-4 sm:px-8">
        <Wordmark />

        <nav aria-label="Sections" className="ml-8 hidden gap-7 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[0.9375rem] text-ink-2 transition-colors duration-130 hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <Link href="/app" className="btn btn-primary px-4 py-2 text-sm">
              Open the App
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-[0.9375rem] text-ink-2 hover:text-ink sm:block"
              >
                Sign in
              </Link>
              <Link href="/signup" className="btn btn-primary px-4 py-2 text-sm">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
