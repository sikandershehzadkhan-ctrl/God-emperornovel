CREATE TABLE IF NOT EXISTS community_collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 80),
  description TEXT NOT NULL DEFAULT '' CHECK(length(description) <= 500),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK(visibility IN ('private','public')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_community_collections_public
  ON community_collections(visibility, updated_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_community_collections_owner
  ON community_collections(owner_user_id, updated_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS community_collection_items (
  collection_id INTEGER NOT NULL REFERENCES community_collections(id) ON DELETE CASCADE,
  novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(collection_id, novel_id)
);
CREATE INDEX IF NOT EXISTS idx_community_collection_items_order
  ON community_collection_items(collection_id, position, added_at);

CREATE TRIGGER IF NOT EXISTS trg_community_collections_owner_limit
BEFORE INSERT ON community_collections
WHEN (SELECT COUNT(*) FROM community_collections WHERE owner_user_id=NEW.owner_user_id) >= 50
BEGIN
  SELECT RAISE(ABORT, 'community_collection_owner_limit');
END;

CREATE TRIGGER IF NOT EXISTS trg_community_collection_items_limit
BEFORE INSERT ON community_collection_items
WHEN (SELECT COUNT(*) FROM community_collection_items WHERE collection_id=NEW.collection_id) >= 100
BEGIN
  SELECT RAISE(ABORT, 'community_collection_item_limit');
END;
