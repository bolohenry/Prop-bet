-- Initial schema for Wedding Prop Bets
CREATE TABLE IF NOT EXISTS weddings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  admin_token TEXT NOT NULL UNIQUE,
  submissions_open INTEGER NOT NULL DEFAULT 1,
  winner_submission_id INTEGER,
  created_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL,
  FOREIGN KEY (winner_submission_id) REFERENCES submissions(id)
);

CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wedding_id INTEGER NOT NULL,
  display_name TEXT NOT NULL,
  submitted_at_utc TEXT NOT NULL,
  q1_whose_wedding TEXT NOT NULL,
  q2_your_name TEXT NOT NULL,
  q3_neon_sign TEXT NOT NULL,
  q4_photo_booth TEXT NOT NULL,
  q5_sweetheart_table TEXT NOT NULL,
  q6_choreographed_first_dance TEXT NOT NULL,
  q7_best_man_speech_over_under TEXT NOT NULL,
  q8_maid_of_honor_speech_over_under TEXT NOT NULL,
  q9_best_man_beautiful_thank_parents TEXT NOT NULL,
  q10_job_mentioned TEXT NOT NULL,
  q11_bouquet_toss TEXT NOT NULL,
  q12_dress_change TEXT NOT NULL,
  q13_tiebreaker TEXT NOT NULL,
  FOREIGN KEY (wedding_id) REFERENCES weddings(id),
  UNIQUE (wedding_id, display_name)
);

CREATE TABLE IF NOT EXISTS answer_keys (
  wedding_id INTEGER PRIMARY KEY,
  q3_neon_sign TEXT NOT NULL,
  q4_photo_booth TEXT NOT NULL,
  q5_sweetheart_table TEXT NOT NULL,
  q6_choreographed_first_dance TEXT NOT NULL,
  q7_best_man_speech_over_under TEXT NOT NULL,
  q8_maid_of_honor_speech_over_under TEXT NOT NULL,
  q9_best_man_beautiful_thank_parents TEXT NOT NULL,
  q10_job_mentioned TEXT NOT NULL,
  q11_bouquet_toss TEXT NOT NULL,
  q12_dress_change TEXT NOT NULL,
  FOREIGN KEY (wedding_id) REFERENCES weddings(id)
);

CREATE TABLE IF NOT EXISTS admin_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wedding_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  created_at_utc TEXT NOT NULL,
  FOREIGN KEY (wedding_id) REFERENCES weddings(id)
);
