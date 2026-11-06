-- Imperial Novel 17.26.0: bind every comic page asset to the owner of its novel.
-- Migration 0004 introduces novels.owner_user_id on fresh installs. Existing
-- installations already receive it through the publishing-schema bootstrap.
CREATE TRIGGER IF NOT EXISTS trg_comic_page_asset_must_match_novel_owner_insert
BEFORE INSERT ON comic_chapter_pages
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1
  FROM chapters c
  JOIN novels n ON n.id = c.novel_id
  JOIN media_assets a ON a.id = NEW.media_asset_id
  WHERE c.id = NEW.chapter_id
    AND n.owner_user_id IS NOT NULL
    AND n.owner_user_id = a.owner_user_id
)
BEGIN
  SELECT RAISE(ABORT, 'media asset owner does not own the target novel');
END;

CREATE TRIGGER IF NOT EXISTS trg_comic_page_asset_must_match_novel_owner_update
BEFORE UPDATE OF chapter_id, media_asset_id ON comic_chapter_pages
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1
  FROM chapters c
  JOIN novels n ON n.id = c.novel_id
  JOIN media_assets a ON a.id = NEW.media_asset_id
  WHERE c.id = NEW.chapter_id
    AND n.owner_user_id IS NOT NULL
    AND n.owner_user_id = a.owner_user_id
)
BEGIN
  SELECT RAISE(ABORT, 'media asset owner does not own the target novel');
END;
