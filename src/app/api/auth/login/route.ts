import { NextResponse } from "next/server";
import { startSession, verifyPassword } from "@/lib/auth";
import { findUserByEmail } from "@/lib/db";
import { failure, readJson } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await readJson<{ email?: string; password?: string }>(request);
  if (!body) return NextResponse.json({ error: "Malformed request." }, { status: 400 });

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  try {
    const user = findUserByEmail(email);
    // Same message either way: a distinct one would confirm which emails exist.
    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
    }
    await startSession(user.id);
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    return failure(err, "Could not sign you in.");
  }
}
