import Link from "next/link";

/**
 * The mark carries a small filled square — the "explained" node from the
 * concept graph. The product's core object doubles as its logo.
 */
export function Wordmark({ href = "/", muted = false }: { href?: string; muted?: boolean }) {
  return (
    <Link href={href} className="group inline-flex items-baseline gap-2" translate="no">
      <span
        aria-hidden="true"
        className="inline-block h-2 w-2 translate-y-[-1px] border border-ink bg-ok transition-colors duration-130 group-hover:bg-ink"
      />
      <span
        className={`font-display text-lg leading-none tracking-tight ${muted ? "text-ink-2" : "text-ink"}`}
      >
        ExplainBack
      </span>
    </Link>
  );
}
