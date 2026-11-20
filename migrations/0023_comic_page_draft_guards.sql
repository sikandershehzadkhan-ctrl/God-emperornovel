-- Imperial Novel 17.29.0: comic page composition is draft-only.
-- API checks are useful feedback; these triggers make the lifecycle rule authoritative in D1.
CREATE TRIGGER IF NOT EXISTS trg_comic_pages_insert_only_draft
BEFORE INSERT ON comic_chapter_pages
FOR EACH ROW
WHEN (SELECT publication_status FROM chapters WHERE id=NEW.chapter_id) != 'draft'
BEGIN
  SELECT RAISE(ABORT, 'comic pages can only be changed while the chapter is a draft');
END;

CREATE TRIGGER IF NOT EXISTS trg_comic_pages_update_only_draft
BEFORE UPDATE OF chapter_id, media_asset_id, page_number, alt_text, caption ON comic_chapter_pages
FOR EACH ROW
WHEN (SELECT publication_status FROM chapters WHERE id=NEW.chapter_id) != 'draft'
  OR (SELECT publication_status FROM chapters WHERE id=OLD.chapter_id) != 'draft'
BEGIN
  SELECT RAISE(ABORT, 'comic pages can only be changed while the chapter is a draft');
END;

CREATE TRIGGER IF NOT EXISTS trg_comic_pages_delete_only_draft
BEFORE DELETE ON comic_chapter_pages
FOR EACH ROW
WHEN (SELECT publication_status FROM chapters WHERE id=OLD.chapter_id) != 'draft'
BEGIN
  SELECT RAISE(ABORT, 'comic pages can only be changed while the chapter is a draft');
END;
