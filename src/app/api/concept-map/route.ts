import { NextResponse } from "next/server";
import { callStructured } from "@/lib/anthropic";
import { requireUser } from "@/lib/auth";
import { failure, readJson } from "@/lib/http";
import { isSupportedLanguageCode, languageLabel, DEFAULT_LANGUAGE_CODE } from "@/lib/languages";
import { CONCEPT_MAP_SCHEMA } from "@/lib/schemas";
import { conceptMapSystem, conceptMapUser } from "@/lib/prompts";
import { getMap, saveMap } from "@/lib/store";
import { sanitizeMap } from "@/lib/validate";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    await requireUser();

    const body = await readJson<{ topic?: unknown; language?: unknown }>(request);
    const topic = typeof body?.topic === "string" ? body.topic.trim() : "";
    const languageCode =
      typeof body?.language === "string" && isSupportedLanguageCode(body.language)
        ? body.language
        : DEFAULT_LANGUAGE_CODE;

    if (topic.length < 2 || topic.length > 120) {
      return NextResponse.json(
        { error: "A topic has to be 2 to 120 characters." },
        { status: 400 },
      );
    }

    const cached = await getMap(topic, languageCode);
    if (cached) return NextResponse.json({ map: cached });

    const raw = await callStructured<unknown>({
      system: conceptMapSystem(languageLabel(languageCode)),
      user: conceptMapUser(topic),
      schema: CONCEPT_MAP_SCHEMA,
      maxTokens: 4000,
    });
    const map = sanitizeMap(raw, topic);
    await saveMap(map, languageCode);
    return NextResponse.json({ map });
  } catch (err) {
    return failure(err, "Could not build the concept map.");
  }
}
