-- Reverse-lookup indexes for public catalog genre/tag filters.
-- Existing composite primary keys start with novel_id; discovery filters start with genre_id/tag_id.
CREATE INDEX IF NOT EXISTS idx_novel_genres_genre_novel ON novel_genres(genre_id,novel_id);
CREATE INDEX IF NOT EXISTS idx_novel_tags_tag_novel ON novel_tags(tag_id,novel_id);
CREATE INDEX IF NOT EXISTS idx_unlocks_chapter_time ON unlocks(chapter_id,unlocked_at);
