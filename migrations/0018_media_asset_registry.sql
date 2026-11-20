-- Imperial Novel 17.24.0: private media asset registry for rights-aware creator uploads.
-- This migration stores metadata only. It does NOT create an R2 bucket or enable uploads.
CREATE TABLE IF NOT EXISTS media_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_user_id INTEGER NOT NULL,
  storage_provider TEXT NOT NULL DEFAULT 'r2' CHECK (storage_provider IN ('r2')),
  object_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg','image/png','image/webp','image/avif','image/gif')),
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 20971520),
  width INTEGER CHECK (width IS NULL OR (width > 0 AND width <= 20000)),
  height INTEGER CHECK (height IS NULL OR (height > 0 AND height <= 20000)),
  sha256_hex TEXT CHECK (sha256_hex IS NULL OR (length(sha256_hex) = 64 AND sha256_hex NOT GLOB '*[^0-9a-f]*')),
  status TEXT NOT NULL DEFAULT 'pending_upload'
    CHECK (status IN ('pending_upload','uploaded','processing','ready','rejected','deleted')),
  rights_status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (rights_status IN ('pending_review','approved','rejected','withdrawn')),
  rights_holder TEXT DEFAULT '',
  license_name TEXT DEFAULT '',
  rights_evidence TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  uploaded_at TEXT,
  reviewed_at TEXT,
  deleted_at TEXT,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_media_assets_owner_status
  ON media_assets(owner_user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_rights_status
  ON media_assets(rights_status, status, created_at);

CREATE TABLE IF NOT EXISTS comic_chapter_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id INTEGER NOT NULL,
  media_asset_id INTEGER NOT NULL,
  page_number INTEGER NOT NULL CHECK (page_number > 0 AND page_number <= 300),
  alt_text TEXT NOT NULL DEFAULT '' CHECK (length(alt_text) <= 300),
  caption TEXT NOT NULL DEFAULT '' CHECK (length(caption) <= 500),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(chapter_id, page_number),
  UNIQUE(chapter_id, media_asset_id),
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
  FOREIGN KEY (media_asset_id) REFERENCES media_assets(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_comic_pages_chapter_order
  ON comic_chapter_pages(chapter_id, page_number);
CREATE INDEX IF NOT EXISTS idx_comic_pages_asset
  ON comic_chapter_pages(media_asset_id);
