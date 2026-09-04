import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { ConceptMap, Diagnosis, GapType, StudyCard } from "./types";

/**
 * Storage: Cloudflare D1 (SQLite, managed at the edge). All access goes
 * through the `DB` binding declared in wrangler.jsonc — there is no local
 * file and no separate database service to run.
 */

async function db(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  return env.DB;
}

/* ---------------------------------------------------------------- users --- */

export interface UserRow {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
}

export async function createUser(
  email: string,
  name: string,
  passwordHash: string,
): Promise<UserRow> {
  const d = await db();
  await d
    .prepare("INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)")
    .bind(email, name, passwordHash)
    .run();
  return (await findUserByEmail(email))!;
}

export async function findUserByEmail(email: string): Promise<UserRow | undefined> {
  const d = await db();
  const row = await d.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<UserRow>();
  return row ?? undefined;
}

/* ------------------------------------------------------------- sessions --- */

export async function createSession(
  token: string,
  userId: number,
  expiresAt: Date,
): Promise<void> {
  const d = await db();
  await d
    .prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(token, userId, expiresAt.toISOString())
    .run();
}

export async function findSessionUser(token: string): Promise<UserRow | undefined> {
  const d = await db();
  const row = await d
    .prepare(
      `SELECT u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now')`,
    )
    .bind(token)
    .first<UserRow>();
  return row ?? undefined;
}

export async function deleteSession(token: string): Promise<void> {
  const d = await db();
  await d.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
}

/* ----------------------------------------------------------------- maps --- */

export async function readCachedMap(slug: string): Promise<ConceptMap | undefined> {
  const d = await db();
  const row = await d
    .prepare("SELECT payload FROM maps WHERE slug = ?")
    .bind(slug)
    .first<{ payload: string }>();
  return row ? (JSON.parse(row.payload) as ConceptMap) : undefined;
}

export async function writeCachedMap(slug: string, map: ConceptMap): Promise<void> {
  const d = await db();
  await d
    .prepare(
      `INSERT INTO maps (slug, topic, payload) VALUES (?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET payload = excluded.payload`,
    )
    .bind(slug, map.topic, JSON.stringify(map))
    .run();
}

export async function listGeneratedMaps(
  limit = 24,
): Promise<{ slug: string; topic: string }[]> {
  const d = await db();
  const { results } = await d
    .prepare("SELECT slug, topic FROM maps ORDER BY created_at DESC LIMIT ?")
    .bind(limit)
    .all<{ slug: string; topic: string }>();
  return results;
}

/* ----------------------------------------------------------------- runs --- */

export interface RunSummary {
  id: number;
  topic: string;
  createdAt: string;
  attempts: number;
  firstCoverage: number;
  firstDepth: number;
  lastCoverage: number;
  lastDepth: number;
  openGaps: number;
  closedGaps: number;
}

export async function createRun(
  userId: number,
  topic: string,
  map: ConceptMap,
): Promise<number> {
  const d = await db();
  const result = await d
    .prepare("INSERT INTO runs (user_id, topic, map) VALUES (?, ?, ?)")
    .bind(userId, topic, JSON.stringify(map))
    .run();
  return Number(result.meta.last_row_id);
}

export async function addAttempt(
  runId: number,
  idx: number,
  explanation: string,
  diagnosis: Diagnosis,
  elapsedMs: number,
): Promise<void> {
  const d = await db();
  await d
    .prepare(
      `INSERT INTO attempts (run_id, idx, explanation, diagnosis, elapsed_ms)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(runId, idx, explanation, JSON.stringify(diagnosis), elapsedMs)
    .run();
}

export async function ownsRun(userId: number, runId: number): Promise<boolean> {
  const d = await db();
  const row = await d
    .prepare("SELECT 1 AS ok FROM runs WHERE id = ? AND user_id = ?")
    .bind(runId, userId)
    .first<{ ok: number }>();
  return Boolean(row);
}

interface RawRun {
  id: number;
  topic: string;
  map: string;
  created_at: string;
}
interface RawAttempt {
  idx: number;
  explanation: string;
  diagnosis: string;
  elapsed_ms: number;
  created_at: string;
}

export interface Attempted {
  index: number;
  explanation: string;
  diagnosis: Diagnosis;
  elapsedMs: number;
  createdAt: string;
}

export async function getRun(
  userId: number,
  runId: number,
): Promise<
  { id: number; topic: string; createdAt: string; map: ConceptMap; attempts: Attempted[] } | null
> {
  const d = await db();
  const run = await d
    .prepare("SELECT * FROM runs WHERE id = ? AND user_id = ?")
    .bind(runId, userId)
    .first<RawRun>();
  if (!run) return null;

  const { results } = await d
    .prepare("SELECT * FROM attempts WHERE run_id = ? ORDER BY idx")
    .bind(runId)
    .all<RawAttempt>();

  return {
    id: run.id,
    topic: run.topic,
    createdAt: run.created_at,
    map: JSON.parse(run.map) as ConceptMap,
    attempts: results.map((row) => ({
      index: row.idx,
      explanation: row.explanation,
      diagnosis: JSON.parse(row.diagnosis) as Diagnosis,
      elapsedMs: row.elapsed_ms,
      createdAt: row.created_at,
    })),
  };
}

export async function listRuns(userId: number, limit = 50): Promise<RunSummary[]> {
  const d = await db();
  const { results: runs } = await d
    .prepare("SELECT * FROM runs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?")
    .bind(userId, limit)
    .all<RawRun>();

  const summaries = await Promise.all(
    runs.map(async (run) => {
      const { results: rows } = await d
        .prepare("SELECT * FROM attempts WHERE run_id = ? ORDER BY idx")
        .bind(run.id)
        .all<RawAttempt>();
      const parsed = rows.map((row) => JSON.parse(row.diagnosis) as Diagnosis);
      const first = parsed[0];
      const last = parsed[parsed.length - 1];
      const closed = last && parsed.length > 1 ? last.resolvedGapIds.length : 0;

      return {
        id: run.id,
        topic: run.topic,
        createdAt: run.created_at,
        attempts: rows.length,
        firstCoverage: first?.coverage ?? 0,
        firstDepth: first?.depth ?? 0,
        lastCoverage: last?.coverage ?? 0,
        lastDepth: last?.depth ?? 0,
        openGaps: last?.gaps.length ?? 0,
        closedGaps: closed,
      };
    }),
  );

  // A run opened but abandoned before the first submission has nothing to
  // show and no detail page to link to, so it never reaches the history.
  return summaries.filter((run) => run.attempts > 0);
}

/* ---------------------------------------------------------------- cards --- */

interface RawCard {
  id: number;
  run_id: number | null;
  topic: string;
  gap_type: string | null;
  front: string;
  back: string;
  trap: string;
  reps: number;
  interval_days: number;
  ease: number;
  due_at: string;
  last_reviewed_at: string | null;
}

function toCard(row: RawCard): StudyCard {
  return {
    id: row.id,
    runId: row.run_id,
    topic: row.topic,
    gapType: (row.gap_type as GapType | null) ?? null,
    front: row.front,
    back: row.back,
    trap: row.trap,
    reps: row.reps,
    intervalDays: row.interval_days,
    ease: row.ease,
    dueAt: row.due_at,
    lastReviewedAt: row.last_reviewed_at,
  };
}

export async function insertCards(
  userId: number,
  runId: number | null,
  topic: string,
  cards: { front: string; back: string; trap: string; gapType: GapType | null }[],
): Promise<number> {
  const d = await db();
  const statement = d.prepare(
    `INSERT INTO cards (user_id, run_id, topic, gap_type, front, back, trap)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  // D1 batches run as a single round trip and, on the primary replica,
  // atomically — cheaper and safer than awaiting each insert in a loop.
  await d.batch(
    cards.map((card) =>
      statement.bind(userId, runId, topic, card.gapType, card.front, card.back, card.trap),
    ),
  );
  return cards.length;
}

export async function listCards(userId: number): Promise<StudyCard[]> {
  const d = await db();
  const { results } = await d
    .prepare("SELECT * FROM cards WHERE user_id = ? ORDER BY due_at, id")
    .bind(userId)
    .all<RawCard>();
  return results.map(toCard);
}

export async function listDueCards(userId: number, limit = 40): Promise<StudyCard[]> {
  const d = await db();
  const { results } = await d
    .prepare(
      `SELECT * FROM cards WHERE user_id = ? AND due_at <= datetime('now')
       ORDER BY due_at LIMIT ?`,
    )
    .bind(userId, limit)
    .all<RawCard>();
  return results.map(toCard);
}

export async function getCard(userId: number, cardId: number): Promise<StudyCard | undefined> {
  const d = await db();
  const row = await d
    .prepare("SELECT * FROM cards WHERE id = ? AND user_id = ?")
    .bind(cardId, userId)
    .first<RawCard>();
  return row ? toCard(row) : undefined;
}

export async function updateCardSchedule(
  cardId: number,
  reps: number,
  intervalDays: number,
  ease: number,
  dueAt: Date,
): Promise<void> {
  const d = await db();
  await d
    .prepare(
      `UPDATE cards
       SET reps = ?, interval_days = ?, ease = ?, due_at = ?,
           last_reviewed_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(reps, intervalDays, ease, dueAt.toISOString(), cardId)
    .run();
}

export async function deleteCard(userId: number, cardId: number): Promise<void> {
  const d = await db();
  await d.prepare("DELETE FROM cards WHERE id = ? AND user_id = ?").bind(cardId, userId).run();
}

/* ------------------------------------------------------------ dashboard --- */

export interface Stats {
  runs: number;
  attempts: number;
  cards: number;
  dueCards: number;
  gapsClosed: number;
  avgDepthGain: number;
  topGapType: GapType | null;
}

export async function getStats(userId: number): Promise<Stats> {
  const d = await db();
  const runs = await listRuns(userId, 500);
  const gapsClosed = runs.reduce((sum, run) => sum + run.closedGaps, 0);
  const improved = runs.filter((run) => run.attempts > 1);
  const avgDepthGain = improved.length
    ? Math.round(
        improved.reduce((sum, run) => sum + (run.lastDepth - run.firstDepth), 0) /
          improved.length,
      )
    : 0;

  const counts = await d
    .prepare(
      `SELECT gap_type AS type, COUNT(*) AS n FROM cards
       WHERE user_id = ? AND gap_type IS NOT NULL
       GROUP BY gap_type ORDER BY n DESC LIMIT 1`,
    )
    .bind(userId)
    .first<{ type: string; n: number }>();

  const cardCount = await d
    .prepare("SELECT COUNT(*) AS n FROM cards WHERE user_id = ?")
    .bind(userId)
    .first<{ n: number }>();
  const dueCount = await d
    .prepare("SELECT COUNT(*) AS n FROM cards WHERE user_id = ? AND due_at <= datetime('now')")
    .bind(userId)
    .first<{ n: number }>();

  return {
    runs: runs.length,
    attempts: runs.reduce((sum, run) => sum + run.attempts, 0),
    cards: Number(cardCount?.n ?? 0),
    dueCards: Number(dueCount?.n ?? 0),
    gapsClosed,
    avgDepthGain,
    topGapType: (counts?.type as GapType | undefined) ?? null,
  };
}
