import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Create your account" };

export default function SignupPage() {
  return (
    <div>
      <h1 className="display text-4xl">Find out what you only half know.</h1>
      <p className="mt-3 leading-relaxed text-ink-2">
        Four topics are ready to diagnose the moment you are in, and any topic of your own
        gets its reference map built on the spot.
      </p>
      <div className="mt-8">
        <AuthForm mode="signup" />
      </div>
      <p className="mt-7 text-ink-2">
        Already have an account?{" "}
        <Link href="/login" className="text-ink underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
