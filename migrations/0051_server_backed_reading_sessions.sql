-- Server-backed reader sessions and one-time chapter completion records.
-- This is schema only: it does not award XP or trust browser-reported time.
-- Requires 0050 so a later application layer can award XP idempotently.

CREATE TABLE IF NOT EXISTS reading_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  chapter_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE
    CHECK (
      length(token_hash) = 64
      AND token_hash NOT GLOB '*[^0-9a-f]*'
    ),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'expired')),
  started_at INTEGER NOT NULL,
  last_heartbeat_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  required_active_seconds INTEGER NOT NULL
    CHECK (required_active_seconds BETWEEN 20 AND 1800),
  active_seconds INTEGER NOT NULL DEFAULT 0
    CHECK (active_seconds BETWEEN 0 AND 7200),
  max_progress_bp INTEGER NOT NULL DEFAULT 0
    CHECK (max_progress_bp BETWEEN 0 AND 10000),
  heartbeat_count INTEGER NOT NULL DEFAULT 0
    CHECK (heartbeat_count BETWEEN 0 AND 10000),
  completed_at INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
  CHECK (last_heartbeat_at >= started_at),
  CHECK (expires_at > started_at),
  CHECK ((status = 'completed' AND completed_at IS NOT NULL)
      OR (status <> 'completed' AND completed_at IS NULL))
);

-- A reader may have only one live session for a given chapter. Expired
-- sessions must be transitioned before a replacement is opened.
CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_sessions_one_active
  ON reading_sessions(user_id, chapter_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_started
  ON reading_sessions(user_id, started_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_reading_sessions_expiry
  ON reading_sessions(status, expires_at);

CREATE INDEX IF NOT EXISTS idx_reading_sessions_chapter_started
  ON reading_sessions(chapter_id, started_at DESC);

CREATE TABLE IF NOT EXISTS reading_completions (
  user_id INTEGER NOT NULL,
  chapter_id INTEGER NOT NULL,
  source_session_id INTEGER NOT NULL UNIQUE,
  completed_at INTEGER NOT NULL,
  qualifying_seconds INTEGER NOT NULL
    CHECK (qualifying_seconds BETWEEN 20 AND 7200),
  progress_basis_points INTEGER NOT NULL
    CHECK (progress_basis_points BETWEEN 9000 AND 10000),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, chapter_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
  FOREIGN KEY (source_session_id) REFERENCES reading_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reading_completions_user_completed
  ON reading_completions(user_id, completed_at DESC);

-- The server may complete a session only after the stored thresholds are met.
CREATE TRIGGER IF NOT EXISTS trg_reading_session_completion_guard
BEFORE UPDATE OF status, completed_at ON reading_sessions
WHEN NEW.status = 'completed'
 AND (
   OLD.status <> 'active'
   OR NEW.completed_at IS NULL
   OR NEW.active_seconds < NEW.required_active_seconds
   OR NEW.max_progress_bp < 9000
 )
BEGIN
  SELECT RAISE(ABORT, 'reading session has not met completion requirements');
END;

-- Terminal sessions cannot be reactivated or moved to another terminal state.
CREATE TRIGGER IF NOT EXISTS trg_reading_session_terminal_guard
BEFORE UPDATE OF status ON reading_sessions
WHEN OLD.status <> 'active' AND NEW.status <> OLD.status
BEGIN
  SELECT RAISE(ABORT, 'reading session is terminal');
END;

-- A completion row must match its own completed, qualified session exactly.
CREATE TRIGGER IF NOT EXISTS trg_reading_completion_session_guard
BEFORE INSERT ON reading_completions
WHEN NOT EXISTS (
  SELECT 1
  FROM reading_sessions s
  WHERE s.id = NEW.source_session_id
    AND s.user_id = NEW.user_id
    AND s.chapter_id = NEW.chapter_id
    AND s.status = 'completed'
    AND s.completed_at = NEW.completed_at
    AND s.active_seconds >= s.required_active_seconds
    AND s.max_progress_bp >= 9000
    AND s.active_seconds = NEW.qualifying_seconds
    AND s.max_progress_bp = NEW.progress_basis_points
)
BEGIN
  SELECT RAISE(ABORT, 'reading completion requires a qualified matching session');
END;
