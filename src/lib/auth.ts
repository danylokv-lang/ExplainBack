import { cookies } from "next/headers";
import { createSession, deleteSession, findSessionUser, type UserRow } from "./db";

const COOKIE = "eb_session";
const SESSION_DAYS = 30;
// Cloudflare Workers caps PBKDF2 at 100,000 iterations via crypto.subtle
// (a CPU-time guard on the edge runtime); Node's Web Crypto has no such
// cap, but capping here keeps the same code path correct on both.
const PBKDF2_ITERATIONS = 100_000;

/**
 * Password hashing via Web Crypto (PBKDF2-SHA256), not node:crypto's scrypt.
 * Web Crypto's `crypto.subtle` is a standard API available identically in
 * Node and in the Cloudflare Workers runtime, so the same code path works
 * in local dev and in production without a Workers-specific fallback.
 */
function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

async function deriveBits(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
}

/** PBKDF2 with a per-user salt; stored as `iterations:salt:hash`, all hex. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await deriveBits(password, salt);
  return `${PBKDF2_ITERATIONS}:${toHex(salt)}:${toHex(derived)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [iterationsRaw, saltHex, hashHex] = stored.split(":");
  const iterations = Number(iterationsRaw);
  if (!iterations || !saltHex || !hashHex) return false;

  const salt = fromHex(saltHex);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    key,
    256,
  );

  const expected = fromHex(hashHex);
  const actual = new Uint8Array(derived);
  if (expected.length !== actual.length) return false;
  // Constant-time compare: crypto.subtle has no timingSafeEqual, so this
  // walks every byte regardless of where a mismatch first occurs.
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ actual[i];
  return diff === 0;
}

export interface SessionUser {
  id: number;
  email: string;
  name: string;
}

function toSessionUser(row: UserRow): SessionUser {
  return { id: row.id, email: row.email, name: row.name };
}

export async function startSession(userId: number): Promise<void> {
  const token = toHex(crypto.getRandomValues(new Uint8Array(32)));
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await createSession(token, userId, expiresAt);

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await deleteSession(token);
  jar.delete(COOKIE);
}

export async function currentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const row = await findSessionUser(token);
  return row ? toSessionUser(row) : null;
}

/** Route-handler guard: returns the user or throws a 401 response. */
export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("You need to sign in to do that.");
    this.name = "UnauthorizedError";
  }
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}
