-- Imperial Novel 16.3.6 legal publishing metadata.
ALTER TABLE novels ADD COLUMN owner_user_id INTEGER;
ALTER TABLE novels ADD COLUMN publication_status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE novels ADD COLUMN rights_evidence TEXT DEFAULT '';
ALTER TABLE novels ADD COLUMN rights_notes TEXT DEFAULT '';
ALTER TABLE novels ADD COLUMN rights_verified_by INTEGER;
ALTER TABLE novels ADD COLUMN rights_verified_at TEXT;
CREATE INDEX IF NOT EXISTS idx_novels_publication ON novels(publication_status,updated_at);
