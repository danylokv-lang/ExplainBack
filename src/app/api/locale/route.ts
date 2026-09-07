import { NextResponse } from "next/server";
import { isUiLocale, LOCALE_COOKIE } from "@/lib/i18n";
import { readJson } from "@/lib/http";

export const runtime = "nodejs";

/** Sets the interface-language cookie. The AI response language is a
 * separate, unrelated setting stored client-side (see language-client.ts). */
export async function POST(request: Request) {
  const body = await readJson<{ locale?: string }>(request);
  if (!body?.locale || !isUiLocale(body.locale)) {
    return NextResponse.json({ error: "Unsupported locale." }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(LOCALE_COOKIE, body.locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}
