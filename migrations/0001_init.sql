-- ExplainBack schema for Cloudflare D1.
-- Mirrors the local node:sqlite schema exactly; D1 is SQLite underneath, so
-- the SQL is unchanged from the original migrate() in src/lib/db.ts.

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
