-- Immutable, specialist-scoped findings let independent reviewers contribute
-- without sharing or impersonating the case-claim lease holder.
-- Findings are review metadata only; they never mutate user content or financial records.

CREATE TABLE IF NOT EXISTS account_deletion_disposition_findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id INTEGER NOT NULL,
  request_id INTEGER NOT NULL,
  dependency_key TEXT NOT NULL CHECK (dependency_key IN (
    'creator_content','creator_rights','ownership_transfers','financial_ledger',
    'donations_refunds_disputes','moderation_legal_holds','ai_projects',
    'omniportal_jobs','sessions_notifications','provider_records','backups'
  )),
  revision INTEGER NOT NULL CHECK (revision > 0),
  reviewer_id INTEGER NOT NULL,
  review_version INTEGER NOT NULL CHECK (review_version > 0),
  outcome TEXT NOT NULL CHECK (outcome IN (
    'retain','anonymize','delete','transfer_with_consent',
    'await_user_action','block'
  )),
  reason TEXT NOT NULL CHECK (length(trim(reason)) BETWEEN 1 AND 500),
  evidence_ref TEXT CHECK (evidence_ref IS NULL OR length(evidence_ref) BETWEEN 1 AND 160),
  policy_reference TEXT NOT NULL CHECK (length(trim(policy_reference)) BETWEEN 1 AND 100),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(review_id, dependency_key, revision),
  FOREIGN KEY(review_id) REFERENCES account_deletion_reviews(id) ON DELETE RESTRICT,
  FOREIGN KEY(request_id) REFERENCES account_deletion_requests(id) ON DELETE RESTRICT,
  FOREIGN KEY(reviewer_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_account_deletion_findings_latest
  ON account_deletion_disposition_findings(review_id, dependency_key, revision DESC);

CREATE TRIGGER IF NOT EXISTS trg_account_deletion_finding_scope
BEFORE INSERT ON account_deletion_disposition_findings
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1
    FROM account_deletion_reviews v
    JOIN account_deletion_requests r ON r.id=v.request_id
    WHERE v.id=NEW.review_id
      AND v.request_id=NEW.request_id
      AND v.subject_user_id<>NEW.reviewer_id
      AND v.version=NEW.review_version
      AND v.state='review_in_progress'
      AND v.claimed_by IS NOT NULL
      AND v.claim_expires_at>CURRENT_TIMESTAMP
      AND r.user_id=v.subject_user_id
      AND r.status IN ('pending_deletion','review_required')
  ) THEN RAISE(ABORT, 'specialist finding scope, lease, or version invalid') END;
  SELECT CASE WHEN NEW.revision<>COALESCE((
    SELECT MAX(existing.revision)+1
    FROM account_deletion_disposition_findings existing
    WHERE existing.review_id=NEW.review_id
      AND existing.dependency_key=NEW.dependency_key
  ),1) THEN RAISE(ABORT, 'specialist finding revision must increase sequentially') END;
END;

CREATE TRIGGER IF NOT EXISTS trg_account_deletion_finding_no_update
BEFORE UPDATE ON account_deletion_disposition_findings
BEGIN
  SELECT RAISE(ABORT, 'specialist findings are immutable; submit a new revision');
END;

CREATE TRIGGER IF NOT EXISTS trg_account_deletion_finding_no_delete
BEFORE DELETE ON account_deletion_disposition_findings
BEGIN
  SELECT RAISE(ABORT, 'specialist findings are immutable');
END;
