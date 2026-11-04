-- Bind password recovery tokens to the exact mailbox that received the link.
-- Old rows have NULL snapshots and therefore cannot be consumed by the hardened completion query.
ALTER TABLE password_reset_tokens ADD COLUMN email_snapshot TEXT;
