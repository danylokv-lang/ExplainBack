import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Wordmark } from "@/components/Wordmark";
import { currentUser } from "@/lib/auth";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await currentUser()) redirect("/app");

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between gap-4">
          <Wordmark />
          <ThemeToggle />
        </div>
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-14">
          {children}
        </main>
      </div>

      {/* The pitch, restated for someone standing at the door. */}
      <aside className="hidden border-l border-rule bg-surface px-10 py-16 lg:flex lg:flex-col lg:justify-center">
        <p className="label">The Feynman loop</p>
        <blockquote className="mt-6 max-w-md font-display text-3xl leading-[1.25] text-ink">
          A topic feels clear right up until you have to explain it. ExplainBack is the
          part where you have to explain it.
        </blockquote>
        <ol className="mt-10 max-w-md space-y-4 border-t border-rule pt-8">
          {[
            ["01", "You explain the topic from memory, in your own words."],
            ["02", "It is compared against a reference map of the mechanism."],
            ["03", "Gaps come back classified, each quoting your own sentence."],
            ["04", "Socratic questions, then you explain it again."],
          ].map(([code, text]) => (
            <li key={code} className="flex gap-4 text-sm leading-relaxed text-ink-2">
              <span className="font-mono text-xs text-ink-3">{code}</span>
              {text}
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
