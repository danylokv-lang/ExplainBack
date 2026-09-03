import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-4xl leading-tight">Welcome back.</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-2">
        Your sessions, gaps and study cards are waiting where you left them.
      </p>
      <div className="mt-8">
        <AuthForm mode="login" />
      </div>
      <p className="mt-6 text-sm text-ink-2">
        No account yet?{" "}
        <Link href="/signup" className="text-ink underline underline-offset-4">
          Create one
        </Link>
      </p>
    </div>
  );
}
