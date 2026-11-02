-- Explicit, auditable reviewer role assignments. No role is inherited from the broad site admin flag.
CREATE TABLE IF NOT EXISTS account_deletion_reviewer_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  role_key TEXT NOT NULL CHECK(role_key IN (
    'support_reviewer','creator_rights_reviewer','finance_compliance_reviewer',
    'privacy_administrator','deletion_second_approver'
  )),
  assigned_by INTEGER NOT NULL,
  assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_by INTEGER,
  revoked_at TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY(assigned_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY(revoked_by) REFERENCES users(id) ON DELETE RESTRICT,
  CHECK ((revoked_by IS NULL AND revoked_at IS NULL) OR (revoked_by IS NOT NULL AND revoked_at IS NOT NULL)),
  CHECK (assigned_by <> user_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_account_deletion_reviewer_active_role
  ON account_deletion_reviewer_assignments(user_id,role_key) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_account_deletion_reviewer_active
  ON account_deletion_reviewer_assignments(role_key,user_id) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS account_deletion_reviewer_assignment_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id INTEGER NOT NULL,
  target_user_id INTEGER NOT NULL,
  actor_id INTEGER NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('assigned','revoked')),
  role_key TEXT NOT NULL CHECK(role_key IN (
    'support_reviewer','creator_rights_reviewer','finance_compliance_reviewer',
    'privacy_administrator','deletion_second_approver'
  )),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(assignment_id) REFERENCES account_deletion_reviewer_assignments(id) ON DELETE RESTRICT,
  FOREIGN KEY(target_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY(actor_id) REFERENCES users(id) ON DELETE RESTRICT,
  CHECK(actor_id <> target_user_id)
);
CREATE INDEX IF NOT EXISTS idx_account_deletion_reviewer_assignment_events
  ON account_deletion_reviewer_assignment_events(target_user_id,id);
CREATE TRIGGER IF NOT EXISTS trg_account_deletion_reviewer_events_no_update
BEFORE UPDATE ON account_deletion_reviewer_assignment_events
BEGIN SELECT RAISE(ABORT,'reviewer assignment events are append-only'); END;
CREATE TRIGGER IF NOT EXISTS trg_account_deletion_reviewer_events_no_delete
BEFORE DELETE ON account_deletion_reviewer_assignment_events
BEGIN SELECT RAISE(ABORT,'reviewer assignment events are append-only'); END;
CREATE TRIGGER IF NOT EXISTS trg_account_deletion_reviewer_assignment_identity_immutable
BEFORE UPDATE OF user_id,role_key,assigned_by,assigned_at ON account_deletion_reviewer_assignments
BEGIN SELECT RAISE(ABORT,'reviewer assignment identity is immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_account_deletion_reviewer_assignment_revoke_once
BEFORE UPDATE OF revoked_by,revoked_at ON account_deletion_reviewer_assignments
WHEN OLD.revoked_at IS NOT NULL OR NEW.revoked_at IS NULL OR NEW.revoked_by IS NULL
BEGIN SELECT RAISE(ABORT,'reviewer assignment can only be revoked once'); END;
