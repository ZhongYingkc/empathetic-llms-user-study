PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS redcap_sync_jobs (
  session_id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'syncing', 'synced', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_attempt_at TEXT,
  synced_at TEXT,
  last_error TEXT,
  FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS redcap_sync_jobs_status_idx
  ON redcap_sync_jobs(status, created_at);
