-- Enforce one active connector rights-authorization request per connector.
-- Existing duplicate pending rows intentionally cause this migration to fail.
-- Reconcile those rows explicitly before applying; never discard request history.
CREATE UNIQUE INDEX IF NOT EXISTS idx_connector_auth_one_pending_per_connector
  ON connector_authorization_requests(connector_id)
  WHERE status = 'pending';
