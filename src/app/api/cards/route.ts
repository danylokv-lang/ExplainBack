import { NextResponse } from "next/server";
import { callStructured } from "@/lib/anthropic";
import { requireUser } from "@/lib/auth";
import { deleteCard, getRun, insertCards, listCards, listDueCards } from "@/lib/db";
import { failure, readJson } from "@/lib/http";
import { CARDS_SYSTEM, cardsUser } from "@/lib/prompts";
import { CARDS_SCHEMA } from "@/lib/schemas";
import type { GapType } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface GeneratedCard {
  gapId: string;
  front: string;
  back: string;
  trap: string;
}

/** Generates study cards from a finished run and stores them for review. */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await readJson<{ runId?: number }>(request);
    const runId = Number(body?.runId);
    if (!Number.isFinite(runId)) {
      return NextResponse.json({ error: "Which session should the cards come from?" }, { status: 400 });
    }

    const run = await getRun(user.id, runId);
    if (!run) return NextResponse.json({ error: "Session not found." }, { status: 404 });

    const latest = run.attempts[run.attempts.length - 1];
    if (!latest) {
      return NextResponse.json({ error: "That session has no diagnosis yet." }, { status: 400 });
    }

    const raw = await callStructured<{ cards?: GeneratedCard[] }>({
      system: CARDS_SYSTEM,
      user: cardsUser(run.map, latest.diagnosis),
      schema: CARDS_SCHEMA,
      maxTokens: 4000,
    });

    const gapType = new Map<string, GapType>(
      latest.diagnosis.gaps.map((gap) => [gap.id, gap.type]),
    );

    const cards = (raw.cards ?? [])
      .filter((card) => card?.front?.trim() && card?.back?.trim())
      .slice(0, 5)
      .map((card) => ({
        front: card.front.trim(),
        back: card.back.trim(),
        trap: (card.trap ?? "").trim(),
        gapType: gapType.get(card.gapId) ?? null,
      }));

    if (cards.length === 0) {
      return NextResponse.json({ error: "No cards came back for this session." }, { status: 502 });
    }

    await insertCards(user.id, runId, run.topic, cards);
    return NextResponse.json({ created: cards.length });
  } catch (err) {
    return failure(err, "Could not generate study cards.");
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const dueOnly = new URL(request.url).searchParams.get("due") === "1";
    return NextResponse.json({
      cards: dueOnly ? await listDueCards(user.id) : await listCards(user.id),
    });
  } catch (err) {
    return failure(err, "Could not load your cards.");
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Which card?" }, { status: 400 });
    }
    await deleteCard(user.id, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return failure(err, "Could not delete that card.");
  }
}
