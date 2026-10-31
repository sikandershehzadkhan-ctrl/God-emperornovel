-- Imperial Novel 17.29.0: idempotent, auditable administrator Crown credits.
CREATE TABLE IF NOT EXISTS admin_ticket_adjustments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  idempotency_key TEXT NOT NULL UNIQUE CHECK (length(idempotency_key) BETWEEN 16 AND 100),
  admin_user_id INTEGER NOT NULL,
  target_user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL CHECK (amount BETWEEN 1 AND 1000000),
  note TEXT NOT NULL CHECK (length(trim(note)) BETWEEN 1 AND 500),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_admin_ticket_adjustments_created
  ON admin_ticket_adjustments(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_admin_ticket_adjustments_target
  ON admin_ticket_adjustments(target_user_id, created_at DESC);

-- The balance change and ledger row are inseparable from the adjustment insert.
CREATE TRIGGER IF NOT EXISTS trg_admin_ticket_adjustment_post
AFTER INSERT ON admin_ticket_adjustments
FOR EACH ROW
BEGIN
  UPDATE users SET tickets = tickets + NEW.amount WHERE id = NEW.target_user_id;
  INSERT INTO ticket_ledger(user_id, delta, reason, reference)
    VALUES(NEW.target_user_id, NEW.amount, 'admin_adjustment', CAST(NEW.id AS TEXT));
END;

CREATE TRIGGER IF NOT EXISTS trg_admin_ticket_adjustments_no_update
BEFORE UPDATE ON admin_ticket_adjustments
BEGIN
  SELECT RAISE(ABORT, 'administrator Crown adjustment history is immutable');
END;

CREATE TRIGGER IF NOT EXISTS trg_admin_ticket_adjustments_no_delete
BEFORE DELETE ON admin_ticket_adjustments
BEGIN
  SELECT RAISE(ABORT, 'administrator Crown adjustment history is immutable');
END;
