import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import type { ConceptMap, Diagnosis, GapType, StudyCard } from "./types";

/**
 * Storage for the MVP: a single SQLite file through Node's built-in driver.
 * No native dependency, no service to run — `npm install && npm run dev` is
 * the whole setup, which is the point for a hackathon build.
 */

const DATA_DIR = process.env.EXPLAINBACK_DATA_DIR ?? path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "explainback.db");

let database: DatabaseSync | null = null;

function db(): DatabaseSync {
  if (database) return database;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  database = new DatabaseSync(DB_PATH);
  database.exec("PRAGMA journal_mode = WAL");
  database.exec("PRAGMA foreign_keys = ON");
  migrate(database);
  return database;
}

function migrate(handle: DatabaseSync): void {
  handle.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT NOT NULL UNIQUE,
      name          TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS maps (
      slug       TEXT PRIMARY KEY,
      topic      TEXT NOT NULL,
      payload    TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS runs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      topic      TEXT NOT NULL,
      map        TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id      INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
      idx         INTEGER NOT NULL,
      explanation TEXT NOT NULL,
      diagnosis   TEXT NOT NULL,
      elapsed_ms  INTEGER NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cards (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      run_id           INTEGER REFERENCES runs(id) ON DELETE SET NULL,
      topic            TEXT NOT NULL,
      gap_type         TEXT,
      front            TEXT NOT NULL,
      back             TEXT NOT NULL,
      trap             TEXT NOT NULL DEFAULT '',
      reps             INTEGER NOT NULL DEFAULT 0,
      interval_days    REAL NOT NULL DEFAULT 0,
      ease             REAL NOT NULL DEFAULT 2.5,
      due_at           TEXT NOT NULL DEFAULT (datetime('now')),
      last_reviewed_at TEXT,
      created_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_runs_user ON runs(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_attempts_run ON attempts(run_id, idx);
    CREATE INDEX IF NOT EXISTS idx_cards_due ON cards(user_id, due_at);
  `);
}

/* ---------------------------------------------------------------- users --- */

export interface UserRow {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
}

export function createUser(email: string, name: string, passwordHash: string): UserRow {
  db()
    .prepare("INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)")
    .run(email, name, passwordHash);
  return findUserByEmail(email)!;
}

export function findUserByEmail(email: string): UserRow | undefined {
  return db().prepare("SELECT * FROM users WHERE email = ?").get(email) as
    | UserRow
    | undefined;
}

/* ------------------------------------------------------------- sessions --- */

export function createSession(token: string, userId: number, expiresAt: Date): void {
  db()
    .prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
    .run(token, userId, expiresAt.toISOString());
}

export function findSessionUser(token: string): UserRow | undefined {
  return db()
    .prepare(
      `SELECT u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now')`,
    )
    .get(token) as UserRow | undefined;
}

export function deleteSession(token: string): void {
  db().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

/* ----------------------------------------------------------------- maps --- */

export function readCachedMap(slug: string): ConceptMap | undefined {
  const row = db().prepare("SELECT payload FROM maps WHERE slug = ?").get(slug) as
    | { payload: string }
    | undefined;
  return row ? (JSON.parse(row.payload) as ConceptMap) : undefined;
}

export function writeCachedMap(slug: string, map: ConceptMap): void {
  db()
    .prepare(
      `INSERT INTO maps (slug, topic, payload) VALUES (?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET payload = excluded.payload`,
    )
    .run(slug, map.topic, JSON.stringify(map));
}

export function listGeneratedMaps(limit = 24): { slug: string; topic: string }[] {
  return db()
    .prepare("SELECT slug, topic FROM maps ORDER BY created_at DESC LIMIT ?")
    .all(limit) as unknown as { slug: string; topic: string }[];
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

export function createRun(userId: number, topic: string, map: ConceptMap): number {
  const result = db()
    .prepare("INSERT INTO runs (user_id, topic, map) VALUES (?, ?, ?)")
    .run(userId, topic, JSON.stringify(map));
  return Number(result.lastInsertRowid);
}

export function addAttempt(
  runId: number,
  idx: number,
  explanation: string,
  diagnosis: Diagnosis,
  elapsedMs: number,
): void {
  db()
    .prepare(
      `INSERT INTO attempts (run_id, idx, explanation, diagnosis, elapsed_ms)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(runId, idx, explanation, JSON.stringify(diagnosis), elapsedMs);
}

export function ownsRun(userId: number, runId: number): boolean {
  const row = db()
    .prepare("SELECT 1 AS ok FROM runs WHERE id = ? AND user_id = ?")
    .get(runId, userId) as { ok: number } | undefined;
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

export function getRun(
  userId: number,
  runId: number,
): { id: number; topic: string; createdAt: string; map: ConceptMap; attempts: Attempted[] } | null {
  const run = db()
    .prepare("SELECT * FROM runs WHERE id = ? AND user_id = ?")
    .get(runId, userId) as RawRun | undefined;
  if (!run) return null;

  const rows = db()
    .prepare("SELECT * FROM attempts WHERE run_id = ? ORDER BY idx")
    .all(runId) as unknown as RawAttempt[];

  return {
    id: run.id,
    topic: run.topic,
    createdAt: run.created_at,
    map: JSON.parse(run.map) as ConceptMap,
    attempts: rows.map((row) => ({
      index: row.idx,
      explanation: row.explanation,
      diagnosis: JSON.parse(row.diagnosis) as Diagnosis,
      elapsedMs: row.elapsed_ms,
      createdAt: row.created_at,
    })),
  };
}

export interface Attempted {
  index: number;
  explanation: string;
  diagnosis: Diagnosis;
  elapsedMs: number;
  createdAt: string;
}

export function listRuns(userId: number, limit = 50): RunSummary[] {
  const runs = db()
    .prepare("SELECT * FROM runs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?")
    .all(userId, limit) as unknown as RawRun[];

  return runs
    .map((run) => {
      const rows = db()
        .prepare("SELECT * FROM attempts WHERE run_id = ? ORDER BY idx")
        .all(run.id) as unknown as RawAttempt[];
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
    })
    // A run opened but abandoned before the first submission has nothing to
    // show and no detail page to link to, so it never reaches the history.
    .filter((run) => run.attempts > 0);
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

export function insertCards(
  userId: number,
  runId: number | null,
  topic: string,
  cards: { front: string; back: string; trap: string; gapType: GapType | null }[],
): number {
  const statement = db().prepare(
    `INSERT INTO cards (user_id, run_id, topic, gap_type, front, back, trap)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const card of cards) {
    statement.run(userId, runId, topic, card.gapType, card.front, card.back, card.trap);
  }
  return cards.length;
}

export function listCards(userId: number): StudyCard[] {
  return (
    db()
      .prepare("SELECT * FROM cards WHERE user_id = ? ORDER BY due_at, id")
      .all(userId) as unknown as RawCard[]
  ).map(toCard);
}

export function listDueCards(userId: number, limit = 40): StudyCard[] {
  return (
    db()
      .prepare(
        `SELECT * FROM cards WHERE user_id = ? AND due_at <= datetime('now')
         ORDER BY due_at LIMIT ?`,
      )
      .all(userId, limit) as unknown as RawCard[]
  ).map(toCard);
}

export function getCard(userId: number, cardId: number): StudyCard | undefined {
  const row = db()
    .prepare("SELECT * FROM cards WHERE id = ? AND user_id = ?")
    .get(cardId, userId) as RawCard | undefined;
  return row ? toCard(row) : undefined;
}

export function updateCardSchedule(
  cardId: number,
  reps: number,
  intervalDays: number,
  ease: number,
  dueAt: Date,
): void {
  db()
    .prepare(
      `UPDATE cards
       SET reps = ?, interval_days = ?, ease = ?, due_at = ?,
           last_reviewed_at = datetime('now')
       WHERE id = ?`,
    )
    .run(reps, intervalDays, ease, dueAt.toISOString(), cardId);
}

export function deleteCard(userId: number, cardId: number): void {
  db().prepare("DELETE FROM cards WHERE id = ? AND user_id = ?").run(cardId, userId);
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

export function getStats(userId: number): Stats {
  const runs = listRuns(userId, 500);
  const gapsClosed = runs.reduce((sum, run) => sum + run.closedGaps, 0);
  const improved = runs.filter((run) => run.attempts > 1);
  const avgDepthGain = improved.length
    ? Math.round(
        improved.reduce((sum, run) => sum + (run.lastDepth - run.firstDepth), 0) /
          improved.length,
      )
    : 0;

  const counts = db()
    .prepare(
      `SELECT gap_type AS type, COUNT(*) AS n FROM cards
       WHERE user_id = ? AND gap_type IS NOT NULL
       GROUP BY gap_type ORDER BY n DESC LIMIT 1`,
    )
    .get(userId) as { type: string; n: number } | undefined;

  const cardCount = db()
    .prepare("SELECT COUNT(*) AS n FROM cards WHERE user_id = ?")
    .get(userId) as { n: number };
  const dueCount = db()
    .prepare(
      "SELECT COUNT(*) AS n FROM cards WHERE user_id = ? AND due_at <= datetime('now')",
    )
    .get(userId) as { n: number };

  return {
    runs: runs.length,
    attempts: runs.reduce((sum, run) => sum + run.attempts, 0),
    cards: Number(cardCount.n),
    dueCards: Number(dueCount.n),
    gapsClosed,
    avgDepthGain,
    topGapType: (counts?.type as GapType | undefined) ?? null,
  };
}
