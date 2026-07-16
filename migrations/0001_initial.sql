PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS study_sessions (
  id TEXT PRIMARY KEY,
  access_mode TEXT NOT NULL CHECK (access_mode IN ('participant', 'researcher')),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  study_version TEXT NOT NULL,
  scenario_order_json TEXT NOT NULL,
  response_orders_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS questionnaire_answers (
  session_id TEXT NOT NULL,
  questionnaire_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  value INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (session_id, questionnaire_id, item_id),
  FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scenario_prompts (
  session_id TEXT NOT NULL,
  scenario_id TEXT NOT NULL,
  display_position INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (session_id, scenario_id),
  FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS response_evaluations (
  session_id TEXT NOT NULL,
  scenario_id TEXT NOT NULL,
  response_id TEXT NOT NULL,
  scenario_display_position INTEGER NOT NULL,
  response_display_position INTEGER NOT NULL,
  content_version INTEGER NOT NULL DEFAULT 1,
  reason TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (session_id, scenario_id, response_id),
  FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS response_rating_items (
  session_id TEXT NOT NULL,
  scenario_id TEXT NOT NULL,
  response_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  value INTEGER NOT NULL CHECK (value >= 0 AND value <= 100),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (session_id, scenario_id, response_id, item_id),
  FOREIGN KEY (session_id, scenario_id, response_id)
    REFERENCES response_evaluations(session_id, scenario_id, response_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS questionnaire_answers_session_idx
  ON questionnaire_answers(session_id);

CREATE INDEX IF NOT EXISTS scenario_prompts_session_idx
  ON scenario_prompts(session_id);

CREATE INDEX IF NOT EXISTS response_evaluations_session_idx
  ON response_evaluations(session_id);

CREATE INDEX IF NOT EXISTS response_rating_items_session_idx
  ON response_rating_items(session_id);

