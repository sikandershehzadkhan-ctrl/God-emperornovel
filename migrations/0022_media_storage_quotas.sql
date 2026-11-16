-- Imperial Novel 17.28.0: hard storage quotas for the zero-budget media pilot.
-- Rejected objects remain charged until storage deletion is confirmed and status becomes deleted.
-- Limits: 100 MiB per creator and 1 GiB across the platform.
CREATE TRIGGER IF NOT EXISTS trg_media_asset_owner_quota_insert
BEFORE INSERT ON media_assets
FOR EACH ROW
WHEN NEW.status != 'deleted'
 AND (
   COALESCE((SELECT SUM(size_bytes) FROM media_assets
             WHERE owner_user_id=NEW.owner_user_id AND status!='deleted'),0) + NEW.size_bytes > 104857600
   OR
   COALESCE((SELECT SUM(size_bytes) FROM media_assets WHERE status!='deleted'),0) + NEW.size_bytes > 1073741824
 )
BEGIN
  SELECT RAISE(ABORT, 'media storage quota exceeded');
END;

CREATE TRIGGER IF NOT EXISTS trg_media_asset_owner_quota_update
BEFORE UPDATE OF owner_user_id, size_bytes, status ON media_assets
FOR EACH ROW
WHEN NEW.status != 'deleted'
 AND (
   COALESCE((SELECT SUM(size_bytes) FROM media_assets
             WHERE owner_user_id=NEW.owner_user_id AND status!='deleted' AND id!=OLD.id),0) + NEW.size_bytes > 104857600
   OR
   COALESCE((SELECT SUM(size_bytes) FROM media_assets
             WHERE status!='deleted' AND id!=OLD.id),0) + NEW.size_bytes > 1073741824
 )
BEGIN
  SELECT RAISE(ABORT, 'media storage quota exceeded');
END;

CREATE TRIGGER IF NOT EXISTS trg_media_asset_mark_deleted_timestamp
AFTER UPDATE OF status ON media_assets
FOR EACH ROW
WHEN NEW.status='deleted' AND OLD.status!='deleted'
BEGIN
  UPDATE media_assets SET deleted_at=COALESCE(deleted_at,CURRENT_TIMESTAMP) WHERE id=NEW.id;
END;

-- Deleted objects are terminal: a removed object must never be reactivated by changing metadata.
CREATE TRIGGER IF NOT EXISTS trg_media_asset_deleted_is_terminal
BEFORE UPDATE OF status ON media_assets
FOR EACH ROW
WHEN OLD.status='deleted' AND NEW.status!='deleted'
BEGIN
  SELECT RAISE(ABORT, 'deleted media assets cannot be reactivated');
END;
