import { NextResponse } from "next/server";
import { callStructured } from "@/lib/anthropic";
import { requireUser } from "@/lib/auth";
import { addAttempt, ownsRun } from "@/lib/db";
import { failure, readJson } from "@/lib/http";
import { DIAGNOSIS_SCHEMA } from "@/lib/schemas";
import { DIAGNOSIS_SYSTEM, diagnosisUser } from "@/lib/prompts";
import { sanitizeDiagnosis } from "@/lib/validate";
import type { ConceptMap, Gap } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface AnalyzeBody {
  map?: ConceptMap;
  explanation?: string;
  attemptIndex?: number;
  runId?: number;
  previous?: { explanation: string; gaps: Gap[] };
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await readJson<AnalyzeBody>(request);
    if (!body) return NextResponse.json({ error: "Malformed request." }, { status: 400 });

    const map = body.map;
    const explanation = (body.explanation ?? "").trim();

    if (!map?.nodes?.length) {
      return NextResponse.json({ error: "No concept map to compare against." }, { status: 400 });
    }
    if (explanation.length < 40) {
      return NextResponse.json(
        { error: "Write at least a few sentences — there is nothing to diagnose yet." },
        { status: 400 },
      );
    }
    if (explanation.length > 6000) {
      return NextResponse.json(
        { error: "That explanation is too long: 6000 characters maximum." },
        { status: 400 },
      );
    }

    const startedAt = Date.now();
    const raw = await callStructured<unknown>({
      system: DIAGNOSIS_SYSTEM,
      user: diagnosisUser(map, explanation, body.previous),
      schema: DIAGNOSIS_SCHEMA,
      maxTokens: 6000,
    });
    const diagnosis = sanitizeDiagnosis(raw, map);
    const elapsedMs = Date.now() - startedAt;

    if (body.runId && (await ownsRun(user.id, body.runId))) {
      await addAttempt(body.runId, body.attemptIndex ?? 1, explanation, diagnosis, elapsedMs);
    }

    return NextResponse.json({ diagnosis, elapsedMs });
  } catch (err) {
    return failure(err, "The diagnosis failed.");
  }
}
