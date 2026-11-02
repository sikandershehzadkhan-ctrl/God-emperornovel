-- Independent approval records are immutable and bind to one exact plan digest.
-- This migration does not enable finalization or account erasure.

CREATE TABLE IF NOT EXISTS account_deletion_disposition_approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL UNIQUE,
  review_id INTEGER NOT NULL,
  request_id INTEGER NOT NULL,
  approver_id INTEGER NOT NULL,
  approved_plan_digest TEXT NOT NULL
    CHECK (length(approved_plan_digest)=64 AND approved_plan_digest NOT GLOB '*[^a-fA-F0-9]*'),
  approval_policy_version TEXT NOT NULL CHECK (length(approval_policy_version) BETWEEN 1 AND 64),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(plan_id) REFERENCES account_deletion_disposition_plans(id) ON DELETE RESTRICT,
  FOREIGN KEY(review_id) REFERENCES account_deletion_reviews(id) ON DELETE RESTRICT,
  FOREIGN KEY(request_id) REFERENCES account_deletion_requests(id) ON DELETE RESTRICT,
  FOREIGN KEY(approver_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_account_deletion_disposition_approvals_case
  ON account_deletion_disposition_approvals(review_id, created_at);

CREATE TRIGGER IF NOT EXISTS trg_account_deletion_disposition_approval_guard
BEFORE INSERT ON account_deletion_disposition_approvals
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1
    FROM account_deletion_disposition_plans p
    JOIN account_deletion_reviews r ON r.id=p.review_id
    WHERE p.id=NEW.plan_id
      AND p.review_id=NEW.review_id
      AND p.request_id=NEW.request_id
      AND p.plan_digest=NEW.approved_plan_digest
      AND r.request_id=NEW.request_id
      AND r.subject_user_id<>NEW.approver_id
      AND p.proposer_id<>NEW.approver_id
  ) THEN RAISE(ABORT, 'approval must independently bind to the exact disposition plan') END;
END;

CREATE TRIGGER IF NOT EXISTS trg_account_deletion_disposition_approval_no_update
BEFORE UPDATE ON account_deletion_disposition_approvals
BEGIN
  SELECT RAISE(ABORT, 'disposition approvals are immutable');
END;

CREATE TRIGGER IF NOT EXISTS trg_account_deletion_disposition_approval_no_delete
BEFORE DELETE ON account_deletion_disposition_approvals
BEGIN
  SELECT RAISE(ABORT, 'disposition approvals are immutable');
END;
