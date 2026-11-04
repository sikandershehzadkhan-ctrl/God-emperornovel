-- Account-deletion review storage only. This migration does not enable deletion execution.
-- Reviewer authorization remains an application-layer, fail-closed responsibility.

CREATE TABLE IF NOT EXISTS account_deletion_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL UNIQUE,
  subject_user_id INTEGER NOT NULL,
  state TEXT NOT NULL DEFAULT 'review_required'
    CHECK (state IN ('review_required','review_in_progress','awaiting_user_action','blocked_retention','review_approved','finalization_eligible','cancelled','rejected')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  claimed_by INTEGER,
  claim_expires_at TEXT,
  proposed_by INTEGER,
  plan_digest TEXT,
  approved_by INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(request_id) REFERENCES account_deletion_requests(id) ON DELETE RESTRICT,
  FOREIGN KEY(subject_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY(claimed_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY(proposed_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY(approved_by) REFERENCES users(id) ON DELETE RESTRICT,
  CHECK ((claimed_by IS NULL AND claim_expires_at IS NULL) OR (claimed_by IS NOT NULL AND claim_expires_at IS NOT NULL)),
  CHECK ((proposed_by IS NULL AND plan_digest IS NULL) OR (proposed_by IS NOT NULL AND length(plan_digest) = 64)),
  CHECK (plan_digest IS NULL OR plan_digest NOT GLOB '*[^a-fA-F0-9]*'),
  CHECK (approved_by IS NULL OR (proposed_by IS NOT NULL AND approved_by <> proposed_by AND approved_by <> subject_user_id)),
  CHECK (claimed_by IS NULL OR claimed_by <> subject_user_id)
);

CREATE INDEX IF NOT EXISTS idx_account_deletion_reviews_queue
  ON account_deletion_reviews(state, created_at, id);
CREATE INDEX IF NOT EXISTS idx_account_deletion_reviews_claim
  ON account_deletion_reviews(claimed_by, claim_expires_at);

CREATE TRIGGER IF NOT EXISTS trg_account_deletion_review_subject_guard
BEFORE INSERT ON account_deletion_reviews
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM account_deletion_requests r
    WHERE r.id = NEW.request_id AND r.user_id = NEW.subject_user_id
      AND r.status IN ('pending_deletion','review_required')
  ) THEN RAISE(ABORT, 'deletion review request/subject mismatch or inactive request') END;
END;

CREATE TRIGGER IF NOT EXISTS trg_account_deletion_review_identity_immutable
BEFORE UPDATE OF request_id, subject_user_id ON account_deletion_reviews
BEGIN
  SELECT RAISE(ABORT, 'deletion review identity is immutable');
END;

CREATE TRIGGER IF NOT EXISTS trg_account_deletion_review_version_guard
BEFORE UPDATE ON account_deletion_reviews
WHEN NEW.version <> OLD.version + 1
BEGIN
  SELECT RAISE(ABORT, 'deletion review version must increment exactly once');
END;

CREATE TABLE IF NOT EXISTS account_deletion_review_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id INTEGER NOT NULL,
  request_id INTEGER NOT NULL,
  actor_id INTEGER,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'case_opened','case_claimed','claim_released','state_changed',
    'disposition_proposed','disposition_approved','user_action_requested',
    'retention_blocked','case_cancelled','case_rejected'
  )),
  from_state TEXT,
  to_state TEXT,
  review_version INTEGER NOT NULL CHECK (review_version > 0),
  metadata_json TEXT NOT NULL DEFAULT '{}'
    CHECK (json_valid(metadata_json) AND length(metadata_json) <= 4096),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(review_id) REFERENCES account_deletion_reviews(id) ON DELETE RESTRICT,
  FOREIGN KEY(request_id) REFERENCES account_deletion_requests(id) ON DELETE RESTRICT,
  FOREIGN KEY(actor_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_account_deletion_review_events_case
  ON account_deletion_review_events(review_id, id);

CREATE TRIGGER IF NOT EXISTS trg_account_deletion_review_events_no_update
BEFORE UPDATE ON account_deletion_review_events
BEGIN
  SELECT RAISE(ABORT, 'account deletion review events are append-only');
END;

CREATE TRIGGER IF NOT EXISTS trg_account_deletion_review_events_no_delete
BEFORE DELETE ON account_deletion_review_events
BEGIN
  SELECT RAISE(ABORT, 'account deletion review events are append-only');
END;

CREATE TRIGGER IF NOT EXISTS trg_account_deletion_review_event_scope
BEFORE INSERT ON account_deletion_review_events
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM account_deletion_reviews v
    WHERE v.id = NEW.review_id AND v.request_id = NEW.request_id
      AND v.version = NEW.review_version
  ) THEN RAISE(ABORT, 'review event scope or version mismatch') END;
  SELECT CASE WHEN NEW.actor_id IS NOT NULL AND NEW.actor_id = (
    SELECT subject_user_id FROM account_deletion_reviews WHERE id = NEW.review_id
  ) THEN RAISE(ABORT, 'requester cannot author review events') END;
END;
