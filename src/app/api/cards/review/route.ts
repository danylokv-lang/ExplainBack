import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getCard, updateCardSchedule } from "@/lib/db";
import { failure, readJson } from "@/lib/http";
import { describeInterval, nextSchedule, type Grade } from "@/lib/srs";

export const runtime = "nodejs";

const GRADES: Grade[] = ["again", "good", "easy"];

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await readJson<{ cardId?: number; grade?: Grade }>(request);
    const cardId = Number(body?.cardId);
    const grade = body?.grade;

    if (!Number.isFinite(cardId) || !grade || !GRADES.includes(grade)) {
      return NextResponse.json({ error: "Malformed review." }, { status: 400 });
    }

    const card = getCard(user.id, cardId);
    if (!card) return NextResponse.json({ error: "Card not found." }, { status: 404 });

    const schedule = nextSchedule(
      { reps: card.reps, intervalDays: card.intervalDays, ease: card.ease },
      grade,
    );
    updateCardSchedule(
      cardId,
      schedule.reps,
      schedule.intervalDays,
      schedule.ease,
      schedule.dueAt,
    );

    return NextResponse.json({
      dueAt: schedule.dueAt.toISOString(),
      interval: describeInterval(schedule.intervalDays),
    });
  } catch (err) {
    return failure(err, "Could not record that review.");
  }
}
