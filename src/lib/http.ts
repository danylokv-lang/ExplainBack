import { NextResponse } from "next/server";
import { EngineError } from "./anthropic";
import { UnauthorizedError } from "./auth";

/** Turns the errors route handlers actually throw into JSON the UI can show. */
export function failure(err: unknown, fallback: string): NextResponse {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
  if (err instanceof EngineError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : fallback;
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
