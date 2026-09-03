import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { Wordmark } from "./Wordmark";
import { currentUser } from "@/lib/auth";

const LINKS = [
  { href: "#problem", label: "The problem" },
  { href: "#method", label: "Method" },
  { href: "#taxonomy", label: "Taxonomy" },
];

export async function SiteHeader() {
  const user = await currentUser();

  return (
    <header className="sticky top-0 z-20 border-b border-rule bg-bg/90 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-5 py-3.5 sm:px-8">
        <Wordmark />

        <nav aria-label="Sections" className="ml-6 hidden gap-6 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="label transition-colors duration-130 hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <Link href="/app" className="btn btn-primary px-4 py-2 text-xs">
              Open the app
            </Link>
          ) : (
            <>
              <Link href="/login" className="label hidden hover:text-ink sm:block">
                Sign in
              </Link>
              <Link href="/signup" className="btn btn-primary px-4 py-2 text-xs">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
