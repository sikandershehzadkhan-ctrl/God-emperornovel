/**
 * Publishing-owned scheduled chapter publication processor.
 *
 * This module deliberately contains no Creator Studio routes or UI concerns.
 * Worker composition remains owned by the platform kernel.
 */
export async function publishDueChapters(env, { notifyUser, canPublishChapter }) {
  const due = await env.DB.prepare(`
    SELECT
      s.chapter_id,
      s.created_by,
      c.chapter_number,
      c.title AS chapter_title,
      n.id AS novel_id,
      n.title AS novel_title,
      n.owner_user_id,
      n.publication_status AS novel_publication_status,
      n.rights_status,
      n.rights_evidence
    FROM scheduled_chapter_publications s
    JOIN chapters c ON c.id = s.chapter_id
    JOIN novels n ON n.id = c.novel_id
    WHERE s.publish_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      AND c.publication_status = 'draft'
      AND n.publication_status = 'published'
      AND n.owner_user_id = s.created_by
      AND n.rights_status IN ('original', 'public_domain', 'licensed', 'authorized')
      AND (n.rights_status = 'original' OR TRIM(COALESCE(n.rights_evidence, '')) <> '')
    ORDER BY s.publish_at
    LIMIT 100
  `).all();

  const rows = due.results || [];
  let published = 0;

  for (const row of rows) {
    if (!canPublishChapter({
      novelPublicationStatus: row.novel_publication_status,
      rightsStatus: row.rights_status,
      rightsEvidence: row.rights_evidence
    })) continue;

    // Each following statement is gated by the immediately preceding
    // statement's changes(). This prevents overlapping cron runs from
    // producing duplicate audit records or notifications.
    const results = await env.DB.batch([
      env.DB.prepare(`
        UPDATE chapters
        SET publication_status = 'published', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND publication_status = 'draft'
          AND EXISTS (
            SELECT 1 FROM novels n
            WHERE n.id = chapters.novel_id
              AND n.owner_user_id = ?
              AND n.publication_status = 'published'
              AND n.rights_status IN ('original', 'public_domain', 'licensed', 'authorized')
              AND (n.rights_status = 'original' OR TRIM(COALESCE(n.rights_evidence, '')) <> '')
          )
      `).bind(row.chapter_id, row.created_by),
      env.DB.prepare(`
        DELETE FROM scheduled_chapter_publications
        WHERE chapter_id = ? AND changes() = 1
      `).bind(row.chapter_id),
      env.DB.prepare(`
        UPDATE novels
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND changes() = 1
      `).bind(row.novel_id),
      env.DB.prepare(`
        INSERT INTO audit_logs(user_id, action, details)
        SELECT ?, ?, ? WHERE changes() = 1
      `).bind(
        row.created_by,
        'author_chapter_scheduled_published',
        `chapter=${row.chapter_id}`
      )
    ]);

    const chapterChanged = Number(results?.[0]?.meta?.changes ?? results?.[0]?.changes ?? 0);
    if (chapterChanged !== 1) continue;

    published += 1;
    await notifyUser(
      env,
      row.created_by,
      'Scheduled chapter published',
      `${row.novel_title} · Chapter ${row.chapter_number}: ${row.chapter_title} is now live.`
    );
  }

  return published;
}
