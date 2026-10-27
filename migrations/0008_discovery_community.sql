-- Imperial Novel 16.20.0 discovery and community upgrades
CREATE TABLE IF NOT EXISTS request_votes (request_id INTEGER NOT NULL,user_id INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(request_id,user_id));
CREATE INDEX IF NOT EXISTS idx_request_votes_request ON request_votes(request_id);
