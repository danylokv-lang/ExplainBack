/**
 * Scheduling for study cards — a trimmed SM-2.
 *
 * Three grades instead of six: a learner who has just been shown a specific
 * misconception does not need to rate confidence on a scale, only to say
 * whether the mechanism came back.
 */
export type Grade = "again" | "good" | "easy";

export interface Schedule {
  reps: number;
  intervalDays: number;
  ease: number;
  dueAt: Date;
}

export function nextSchedule(
  current: { reps: number; intervalDays: number; ease: number },
  grade: Grade,
): Schedule {
  let { reps, intervalDays, ease } = current;

  if (grade === "again") {
    // Back to the start of the ladder, and the card gets easier to trip on.
    reps = 0;
    intervalDays = 0;
    ease = Math.max(1.3, ease - 0.2);
  } else {
    reps += 1;
    ease = grade === "easy" ? Math.min(2.9, ease + 0.12) : ease;
    if (reps === 1) intervalDays = grade === "easy" ? 3 : 1;
    else if (reps === 2) intervalDays = grade === "easy" ? 7 : 4;
    else intervalDays = Math.round(intervalDays * ease * (grade === "easy" ? 1.25 : 1));
  }

  const minutes = intervalDays === 0 ? 10 : intervalDays * 24 * 60;
  return { reps, intervalDays, ease, dueAt: new Date(Date.now() + minutes * 60_000) };
}

export function describeInterval(days: number): string {
  if (days <= 0) return "10 min";
  if (days === 1) return "1 day";
  if (days < 30) return `${days} days`;
  const months = Math.round(days / 30);
  return months === 1 ? "1 month" : `${months} months`;
}
