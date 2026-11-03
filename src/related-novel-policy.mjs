/**
 * Build a private, reader-specific related-story query from that reader's
 * followed and recently read novels. Only public, rights-cleared catalog
 * entries can be recommended; candidates already in the reader's library
 * are excluded. Correlated counts avoid join fan-out.
 */
export function buildRelatedNovelRecommendationsQuery() {
  return `
    WITH seeds AS (
      SELECT novel_id FROM follows WHERE user_id=?
      UNION
      SELECT novel_id FROM history WHERE user_id=?
    ),
    scored AS (
      SELECT n.*,
        (SELECT COUNT(*) FROM novel_genres candidate_genre
          WHERE candidate_genre.novel_id=n.id
            AND candidate_genre.genre_id IN (
              SELECT seed_genre.genre_id FROM novel_genres seed_genre
              JOIN seeds s ON s.novel_id=seed_genre.novel_id
            )
        ) AS genre_overlap,
        (SELECT COUNT(*) FROM novel_tags candidate_tag
          WHERE candidate_tag.novel_id=n.id
            AND candidate_tag.tag_id IN (
              SELECT seed_tag.tag_id FROM novel_tags seed_tag
              JOIN seeds s ON s.novel_id=seed_tag.novel_id
            )
        ) AS tag_overlap,
        CASE WHEN EXISTS (
          SELECT 1 FROM seeds s JOIN novels seed_novel ON seed_novel.id=s.novel_id
          WHERE LOWER(seed_novel.author)=LOWER(n.author)
        ) THEN 1 ELSE 0 END AS author_overlap,
        CASE WHEN EXISTS (
          SELECT 1 FROM seeds s JOIN novels seed_novel ON seed_novel.id=s.novel_id
          WHERE LOWER(seed_novel.kind)=LOWER(n.kind)
        ) THEN 1 ELSE 0 END AS format_overlap
      FROM novels n
      WHERE n.publication_status='published'
        AND n.rights_status IN ('original','public_domain','licensed','authorized')
        AND NOT EXISTS (SELECT 1 FROM seeds s WHERE s.novel_id=n.id)
    )
    SELECT scored.*,
      (genre_overlap*12 + tag_overlap*8 + author_overlap*4 + format_overlap*2) AS score,
      CASE
        WHEN genre_overlap>0 AND tag_overlap>0 THEN 'Shares genres and tags with your reading'
        WHEN genre_overlap>0 THEN 'Shares genres with your reading'
        WHEN tag_overlap>0 THEN 'Shares tags with your reading'
        WHEN author_overlap>0 THEN 'More from an author you read'
        ELSE 'Same format as stories you read'
      END AS reason,
      (SELECT COUNT(*) FROM chapters c WHERE c.novel_id=scored.id) AS chapter_count
    FROM scored
    WHERE genre_overlap+tag_overlap+author_overlap+format_overlap>0
    ORDER BY score DESC, views DESC, updated_at DESC, id DESC
    LIMIT 12
  `;
}

export function relatedNovelRecommendationBindings(userId) {
  return [userId, userId];
}
