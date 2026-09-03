import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createRun, listRuns } from "@/lib/db";
import { failure, readJson } from "@/lib/http";
import type { ConceptMap } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await readJson<{ map?: ConceptMap }>(request);
    if (!body?.map?.nodes?.length) {
      return NextResponse.json({ error: "No concept map to start from." }, { status: 400 });
    }
    const runId = createRun(user.id, body.map.topic, body.map);
    return NextResponse.json({ runId });
  } catch (err) {
    return failure(err, "Could not start the session.");
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ runs: listRuns(user.id) });
  } catch (err) {
    return failure(err, "Could not load your sessions.");
  }
}
