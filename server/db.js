import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'wedding.db');

import fs from 'fs';
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    admin_code TEXT UNIQUE NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    tie_winner_name TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(id),
    display_name TEXT NOT NULL,
    submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
    q1 TEXT, q2 TEXT, q3 TEXT, q4 TEXT, q5 TEXT,
    q6 TEXT, q7 TEXT, q8 TEXT, q9 TEXT, q10 TEXT,
    q11 TEXT, q12 TEXT, q13 TEXT, q14 TEXT, q15 TEXT,
    total_points INTEGER NOT NULL DEFAULT 0,
    UNIQUE(event_id, display_name)
  );

  CREATE TABLE IF NOT EXISTS outcomes (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(id),
    question_id TEXT NOT NULL,
    answer TEXT,
    resolved INTEGER NOT NULL DEFAULT 0,
    UNIQUE(event_id, question_id)
  );
`);

export default db;
