-- Imperial Novel 17.25.0: enforce publication eligibility at the database boundary.
-- Upload metadata alone never makes an asset publishable. A page may reference only
-- a fully processed asset whose rights have been explicitly approved.
CREATE TRIGGER IF NOT EXISTS trg_comic_page_requires_publishable_asset_insert
BEFORE INSERT ON comic_chapter_pages
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1 FROM media_assets
  WHERE id = NEW.media_asset_id
    AND status = 'ready'
    AND rights_status = 'approved'
)
BEGIN
  SELECT RAISE(ABORT, 'media asset is not approved and ready for publication');
END;

CREATE TRIGGER IF NOT EXISTS trg_comic_page_requires_publishable_asset_update
BEFORE UPDATE OF media_asset_id, chapter_id ON comic_chapter_pages
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1 FROM media_assets
  WHERE id = NEW.media_asset_id
    AND status = 'ready'
    AND rights_status = 'approved'
)
BEGIN
  SELECT RAISE(ABORT, 'media asset is not approved and ready for publication');
END;

-- A referenced asset cannot silently become unavailable or lose its rights approval.
-- Remove its chapter-page references through an authorized workflow before changing
-- its lifecycle/rights state.
CREATE TRIGGER IF NOT EXISTS trg_referenced_media_must_remain_publishable
BEFORE UPDATE OF status, rights_status ON media_assets
FOR EACH ROW
WHEN (NEW.status != 'ready' OR NEW.rights_status != 'approved')
 AND EXISTS (
   SELECT 1 FROM comic_chapter_pages WHERE media_asset_id = OLD.id
 )
BEGIN
  SELECT RAISE(ABORT, 'referenced media must remain approved and ready');
END;
