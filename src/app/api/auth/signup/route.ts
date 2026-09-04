import { NextResponse } from "next/server";
import { hashPassword, isValidEmail, startSession } from "@/lib/auth";
import { createUser, findUserByEmail } from "@/lib/db";
import { failure, readJson } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await readJson<{ email?: string; name?: string; password?: string }>(request);
  if (!body) return NextResponse.json({ error: "Malformed request." }, { status: 400 });

  const email = (body.email ?? "").trim().toLowerCase();
  const name = (body.name ?? "").trim();
  const password = body.password ?? "";

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "That doesn't look like an email address." }, { status: 400 });
  }
  if (name.length < 2 || name.length > 60) {
    return NextResponse.json({ error: "Your name should be 2 to 60 characters." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Use at least 8 characters for your password." }, { status: 400 });
  }
  if (await findUserByEmail(email)) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  try {
    const user = await createUser(email, name, await hashPassword(password));
    await startSession(user.id);
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    return failure(err, "Could not create the account.");
  }
}
