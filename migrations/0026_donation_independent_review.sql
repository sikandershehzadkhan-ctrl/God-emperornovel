-- Imperial Novel 17.30.0: prevent donation self-approval at the database boundary.
DROP TRIGGER IF EXISTS trg_donation_decision_requires_review;

CREATE TRIGGER trg_donation_decision_requires_review
BEFORE UPDATE OF status ON donations
FOR EACH ROW
WHEN OLD.status = 'pending'
 AND NEW.status IN ('approved','rejected')
 AND NOT EXISTS (
   SELECT 1 FROM donation_reviews r
   WHERE r.donation_id = OLD.id
     AND r.reviewer_user_id IS NOT NULL
     AND r.reviewer_user_id <> NEW.user_id
     AND r.decision = NEW.status
     AND ((NEW.status = 'approved' AND r.tickets BETWEEN 1 AND 10000)
       OR (NEW.status = 'rejected' AND r.tickets = 0))
 )
BEGIN
  SELECT RAISE(ABORT, 'donation finalization requires an independent attributable review');
END;
