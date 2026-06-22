-- ============================================================
-- SANE PMS — Database Migrations
-- Run this file once against your Supabase PostgreSQL database.
-- All statements are idempotent (safe to re-run).
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. tasks — add is_urgent flag
-- ────────────────────────────────────────────────────────────
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN NOT NULL DEFAULT FALSE;


-- ────────────────────────────────────────────────────────────
-- 2. tasks — add blocker_reason
--    Stores the reason when a task is set to BLOCKED status.
--    Cleared automatically when status changes away from BLOCKED.
-- ────────────────────────────────────────────────────────────
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS blocker_reason TEXT;


-- ────────────────────────────────────────────────────────────
-- 3. meetings — new table for scheduled meetings
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meetings (
    id               SERIAL PRIMARY KEY,
    title            VARCHAR(200)  NOT NULL,
    description      TEXT,
    scheduled_at     TIMESTAMP     NOT NULL,
    duration_minutes INTEGER       NOT NULL DEFAULT 60,
    meet_link        VARCHAR(500),
    is_urgent        BOOLEAN       NOT NULL DEFAULT FALSE,
    project_id       INTEGER       REFERENCES projects(id) ON DELETE SET NULL,
    created_by       INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_deleted       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_at ON meetings (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_meetings_project_id   ON meetings (project_id);
CREATE INDEX IF NOT EXISTS idx_meetings_created_by   ON meetings (created_by);


-- ────────────────────────────────────────────────────────────
-- 4. meeting_attendees — who is invited to each meeting
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meeting_attendees (
    id          SERIAL  PRIMARY KEY,
    meeting_id  INTEGER NOT NULL REFERENCES meetings(id)  ON DELETE CASCADE,
    user_id     INTEGER NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
    UNIQUE (meeting_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_meeting_attendees_user_id ON meeting_attendees (user_id);


-- ────────────────────────────────────────────────────────────
-- Verify (optional — run manually to confirm)
-- ────────────────────────────────────────────────────────────
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'tasks' AND column_name IN ('is_urgent','blocker_reason');
--
-- SELECT table_name FROM information_schema.tables
--   WHERE table_name IN ('meetings','meeting_attendees');
