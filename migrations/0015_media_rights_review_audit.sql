-- Imperial Novel 17.27.0: attributable, append-only media rights decisions.
ALTER TABLE media_assets ADD COLUMN reviewed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS media_asset_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_asset_id INTEGER NOT NULL,
  reviewer_user_id INTEGER NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('approved','rejected','withdrawn')),
  note TEXT NOT NULL DEFAULT '' CHECK (length(note) <= 2000),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (media_asset_id) REFERENCES media_assets(id) ON DELETE RESTRICT,
  FOREIGN KEY (reviewer_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_media_asset_reviews_asset_created
  ON media_asset_reviews(media_asset_id, created_at DESC, id DESC);

-- Approval must have an attributable review record inserted in the same D1 batch.
CREATE TRIGGER IF NOT EXISTS trg_media_asset_approval_requires_review
BEFORE UPDATE OF rights_status ON media_assets
FOR EACH ROW
WHEN NEW.rights_status = 'approved'
 AND OLD.rights_status != 'approved'
 AND (
   NEW.reviewed_by_user_id IS NULL
   OR NOT EXISTS (
     SELECT 1 FROM media_asset_reviews r
     WHERE r.media_asset_id = NEW.id
       AND r.reviewer_user_id = NEW.reviewed_by_user_id
       AND r.decision = 'approved'
   )
 )
BEGIN
  SELECT RAISE(ABORT, 'media rights approval requires an attributable review record');
END;

CREATE TRIGGER IF NOT EXISTS trg_media_asset_reviews_no_update
BEFORE UPDATE ON media_asset_reviews
BEGIN
  SELECT RAISE(ABORT, 'media rights review history is immutable');
END;

CREATE TRIGGER IF NOT EXISTS trg_media_asset_reviews_no_delete
BEFORE DELETE ON media_asset_reviews
BEGIN
  SELECT RAISE(ABORT, 'media rights review history is immutable');
END;
