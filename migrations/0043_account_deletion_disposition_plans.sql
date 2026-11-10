-- Immutable, version-bound disposition plans. This stores review decisions only;
-- it does not authorize account erasure or modify creator/financial records.

CREATE TABLE IF NOT EXISTS account_deletion_disposition_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id INTEGER NOT NULL,
  request_id INTEGER NOT NULL,
  plan_version INTEGER NOT NULL CHECK (plan_version > 0),
  base_review_version INTEGER NOT NULL CHECK (base_review_version > 0),
  proposer_id INTEGER NOT NULL,
  policy_version TEXT NOT NULL CHECK (length(policy_version) BETWEEN 1 AND 64),
  plan_digest TEXT NOT NULL CHECK (length(plan_digest) = 64 AND plan_digest NOT GLOB '*[^a-fA-F0-9]*'),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(review_id, plan_version),
  FOREIGN KEY(review_id) REFERENCES account_deletion_reviews(id) ON DELETE RESTRICT,
  FOREIGN KEY(request_id) REFERENCES account_closure_requests(id) ON DELETE RESTRICT,
  FOREIGN KEY(proposer_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_account_deletion_disposition_plans_case
  ON account_deletion_disposition_plans(review_id, plan_version DESC);

CREATE TABLE IF NOT EXISTS account_deletion_disposition_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  dependency_key TEXT NOT NULL CHECK (dependency_key IN (
    'creator_content','creator_rights','ownership_transfers','financial_ledger',
    'donations_refunds_disputes','moderation_legal_holds','ai_projects',
    'omniportal_jobs','sessions_notifications','provider_records','backups'
  )),
  outcome TEXT NOT NULL CHECK (outcome IN (
    'retain','anonymize','delete','transfer_with_consent',
    'await_user_action','block'
  )),
  reason TEXT NOT NULL CHECK (length(trim(reason)) BETWEEN 1 AND 500),
  evidence_ref TEXT CHECK (evidence_ref IS NULL OR length(evidence_ref) BETWEEN 1 AND 160),
  policy_reference TEXT NOT NULL CHECK (length(trim(policy_reference)) BETWEEN 1 AND 100),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(plan_id, dependency_key),
  FOREIGN KEY(plan_id) REFERENCES account_deletion_disposition_plans(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_account_deletion_disposition_items_plan
  ON account_deletion_disposition_items(plan_id, dependency_key);

CREATE TRIGGER IF NOT EXISTS trg_account_deletion_disposition_plan_scope
BEFORE INSERT ON account_deletion_disposition_plans
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM account_deletion_reviews r
    WHERE r.id=NEW.review_id AND r.request_id=NEW.request_id
      AND r.subject_user_id<>NEW.proposer_id
      AND r.version=NEW.base_review_version
      AND r.state='review_in_progress'
      AND r.claimed_by=NEW.proposer_id
      AND r.claim_expires_at>CURRENT_TIMESTAMP
  ) THEN RAISE(ABORT, 'disposition plan scope, claim, or version invalid') END;
  SELECT CASE WHEN NEW.plan_version <> COALESCE((
    SELECT MAX(plan_version)+1 FROM account_deletion_disposition_plans
    WHERE review_id=NEW.review_id
  ),1) THEN RAISE(ABORT, 'disposition plan version must increase sequentially') END;
END;

CREATE TRIGGER IF NOT EXISTS trg_account_deletion_disposition_plan_no_update
BEFORE UPDATE ON account_deletion_disposition_plans
BEGIN
  SELECT RAISE(ABORT, 'disposition plans are immutable; submit a new version');
END;

CREATE TRIGGER IF NOT EXISTS trg_account_deletion_disposition_plan_no_delete
BEFORE DELETE ON account_deletion_disposition_plans
BEGIN
  SELECT RAISE(ABORT, 'disposition plans are immutable');
END;

CREATE TRIGGER IF NOT EXISTS trg_account_deletion_disposition_item_no_update
BEFORE UPDATE ON account_deletion_disposition_items
BEGIN
  SELECT RAISE(ABORT, 'disposition items are immutable; submit a new plan');
END;

CREATE TRIGGER IF NOT EXISTS trg_account_deletion_disposition_item_no_delete
BEFORE DELETE ON account_deletion_disposition_items
BEGIN
  SELECT RAISE(ABORT, 'disposition items are immutable');
END;

CREATE TRIGGER IF NOT EXISTS trg_account_deletion_disposition_item_actor_scope
BEFORE INSERT ON account_deletion_disposition_items
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM account_deletion_disposition_plans p
    WHERE p.id=NEW.plan_id
  ) THEN RAISE(ABORT, 'disposition plan does not exist') END;
END;
