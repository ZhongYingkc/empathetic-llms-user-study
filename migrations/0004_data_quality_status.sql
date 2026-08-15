ALTER TABLE study_sessions
  ADD COLUMN data_quality_status TEXT NOT NULL DEFAULT 'included'
  CHECK (data_quality_status IN ('included', 'needs_review', 'excluded'));

ALTER TABLE study_sessions
  ADD COLUMN data_quality_note TEXT;

ALTER TABLE study_sessions
  ADD COLUMN quality_reviewed_at TEXT;
