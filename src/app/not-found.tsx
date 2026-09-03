import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col px-5 py-6 sm:px-10">
      <Wordmark />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-16">
        <p className="label">404</p>
        <h1 className="mt-4 text-4xl leading-tight">Nothing here to explain.</h1>
        <p className="mt-3 leading-relaxed text-ink-2">
          That page does not exist — or the session or map it pointed at belongs to
          somebody else.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/app" className="btn btn-primary">
            Go to your overview
          </Link>
          <Link href="/" className="btn btn-ghost">
            Back to the front page
          </Link>
        </div>
      </main>
    </div>
  );
}
