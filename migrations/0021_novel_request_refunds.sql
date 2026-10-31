-- Imperial Novel 17.31.0: database-owned, one-time refunds for paid novel requests.
CREATE TABLE IF NOT EXISTS novel_request_refunds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL UNIQUE,
  admin_user_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL CHECK (amount BETWEEN 1 AND 100000),
  note TEXT NOT NULL CHECK (length(trim(note)) BETWEEN 1 AND 500),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES novel_requests(id) ON DELETE RESTRICT,
  FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_novel_request_refunds_user_created
  ON novel_request_refunds(user_id, created_at DESC);

CREATE TRIGGER IF NOT EXISTS trg_novel_request_refund_validate
BEFORE INSERT ON novel_request_refunds
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1
  FROM novel_requests r
  JOIN users a ON a.id = NEW.admin_user_id AND a.role = 'admin'
  WHERE r.id = NEW.request_id
    AND r.user_id = NEW.user_id
    AND r.status = 'rejected'
    AND r.cost = NEW.amount
    AND r.cost BETWEEN 1 AND 100000
)
BEGIN
  SELECT RAISE(ABORT, 'refund requires an independently authorized admin and a matching rejected paid request');
END;

-- Balance credit and immutable ledger posting occur in the same insert statement.
CREATE TRIGGER IF NOT EXISTS trg_novel_request_refund_post
AFTER INSERT ON novel_request_refunds
FOR EACH ROW
BEGIN
  UPDATE users SET tickets = tickets + NEW.amount WHERE id = NEW.user_id;
  INSERT INTO ticket_ledger(user_id, delta, reason, reference)
    VALUES(NEW.user_id, NEW.amount, 'novel_request_refund', 'novel_request:' || NEW.request_id);
END;

CREATE TRIGGER IF NOT EXISTS trg_novel_request_refunds_no_update
BEFORE UPDATE ON novel_request_refunds
BEGIN
  SELECT RAISE(ABORT, 'novel request refund history is immutable');
END;

CREATE TRIGGER IF NOT EXISTS trg_novel_request_refunds_no_delete
BEFORE DELETE ON novel_request_refunds
BEGIN
  SELECT RAISE(ABORT, 'novel request refund history is immutable');
END;
