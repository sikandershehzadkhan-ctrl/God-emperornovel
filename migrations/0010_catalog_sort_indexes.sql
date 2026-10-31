-- Composite indexes keep the most-used public catalog sorts within the published subset.
-- Include the ID tie-breaker so pagination has a stable, index-backed order.
CREATE INDEX IF NOT EXISTS idx_novels_published_views ON novels(publication_status,views DESC,id DESC);
CREATE INDEX IF NOT EXISTS idx_novels_published_rating ON novels(publication_status,rating DESC,id DESC);
CREATE INDEX IF NOT EXISTS idx_novels_published_created ON novels(publication_status,created_at DESC,id DESC);
