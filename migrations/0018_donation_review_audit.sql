-- Imperial Novel 17.28.0: immutable, attributable donation decisions.
CREATE TABLE IF NOT EXISTS donation_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  donation_id INTEGER NOT NULL UNIQUE,
  reviewer_user_id INTEGER NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('approved','rejected')),
  tickets INTEGER NOT NULL DEFAULT 0 CHECK (tickets >= 0 AND tickets <= 10000),
  note TEXT NOT NULL CHECK (length(trim(note)) BETWEEN 1 AND 1000),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE RESTRICT,
  FOREIGN KEY (reviewer_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CHECK ((decision = 'approved' AND tickets BETWEEN 1 AND 10000) OR (decision = 'rejected' AND tickets = 0))
);

CREATE INDEX IF NOT EXISTS idx_donation_reviews_reviewer_created
  ON donation_reviews(reviewer_user_id, created_at DESC);

-- A donation cannot be finalized without a matching, attributable review.
CREATE TRIGGER IF NOT EXISTS trg_donation_decision_requires_review
BEFORE UPDATE OF status ON donations
FOR EACH ROW
WHEN OLD.status = 'pending'
 AND NEW.status IN ('approved','rejected')
 AND NOT EXISTS (
   SELECT 1 FROM donation_reviews r
   WHERE r.donation_id = OLD.id
     AND r.reviewer_user_id IS NOT NULL
     AND r.decision = NEW.status
     AND ((NEW.status = 'approved' AND r.tickets BETWEEN 1 AND 10000)
       OR (NEW.status = 'rejected' AND r.tickets = 0))
 )
BEGIN
  SELECT RAISE(ABORT, 'donation finalization requires an attributable review');
END;

-- Credit and ledger posting are part of the same status-update statement.
CREATE TRIGGER IF NOT EXISTS trg_donation_approval_posts_crowns
AFTER UPDATE OF status ON donations
FOR EACH ROW
WHEN OLD.status = 'pending' AND NEW.status = 'approved'
BEGIN
  UPDATE users
    SET tickets = tickets + (
      SELECT r.tickets FROM donation_reviews r
      WHERE r.donation_id = NEW.id AND r.decision = 'approved'
    )
    WHERE id = NEW.user_id;

  INSERT INTO ticket_ledger(user_id, delta, reason, reference)
    SELECT NEW.user_id, r.tickets, 'payment', CAST(NEW.id AS TEXT)
    FROM donation_reviews r
    WHERE r.donation_id = NEW.id AND r.decision = 'approved';
END;

CREATE TRIGGER IF NOT EXISTS trg_donation_reviews_no_update
BEFORE UPDATE ON donation_reviews
BEGIN
  SELECT RAISE(ABORT, 'donation review history is immutable');
END;

CREATE TRIGGER IF NOT EXISTS trg_donation_reviews_no_delete
BEFORE DELETE ON donation_reviews
BEGIN
  SELECT RAISE(ABORT, 'donation review history is immutable');
END;

-- Payment credits must have one ledger row per donation.
CREATE UNIQUE INDEX IF NOT EXISTS idx_ticket_ledger_payment_reference
  ON ticket_ledger(reason, reference)
  WHERE reason = 'payment' AND reference <> '';
