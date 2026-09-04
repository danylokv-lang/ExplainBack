import Link from "next/link";

/**
 * A rounded app mark with a checkmark — the "explained" state from the
 * concept graph, standing in for the product's core action: closing a gap.
 */
export function Wordmark({ href = "/", muted = false }: { href?: string; muted?: boolean }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5" translate="no">
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-ink transition-transform duration-130 group-hover:scale-105"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12.5 4.5 4.5L19 7" />
        </svg>
      </span>
      <span className={`display text-lg ${muted ? "text-ink-2" : "text-ink"}`}>
        ExplainBack
      </span>
    </Link>
  );
}
