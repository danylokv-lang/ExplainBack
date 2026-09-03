import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Wordmark } from "@/components/Wordmark";
import { currentUser } from "@/lib/auth";

const STEPS = [
  ["01", "You explain the topic from memory, in your own words."],
  ["02", "It gets checked against a reference map of the mechanism."],
  ["03", "Gaps come back sorted, each quoting a sentence you wrote."],
  ["04", "A few questions, then you explain it again."],
];

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await currentUser()) redirect("/app");

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between gap-4">
          <Wordmark />
          <ThemeToggle />
        </div>
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-16">
          {children}
        </main>
      </div>

      {/* The pitch, restated for someone standing at the door. */}
      <aside className="hidden border-l border-rule bg-surface px-12 py-16 lg:flex lg:flex-col lg:justify-center">
        <p className="text-sm text-ink-3">The Feynman loop</p>
        <blockquote className="display mt-6 max-w-md text-3xl leading-[1.25] text-ink">
          A topic feels clear right up until you have to explain it. ExplainBack is the part
          where you have to explain it.
        </blockquote>
        <ol className="mt-12 max-w-md space-y-5 border-t border-rule pt-9">
          {STEPS.map(([code, text]) => (
            <li key={code} className="flex gap-4 leading-relaxed text-ink-2">
              <span className="code shrink-0 text-ink-3">{code}</span>
              {text}
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
