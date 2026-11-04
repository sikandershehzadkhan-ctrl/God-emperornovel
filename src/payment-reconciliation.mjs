// Read-only provider/payment reconciliation. This module never mutates balances or payment records.
export async function getPaymentReconciliation(db) {
  const [summary, duplicateReferences, donationAnomalies, unmatchedLedger] = await Promise.all([
    db.prepare(`SELECT
      (SELECT COUNT(*) FROM donations) AS donation_count,
      (SELECT COUNT(*) FROM donations WHERE status='pending') AS pending_donations,
      (SELECT COUNT(*) FROM donations WHERE status='approved') AS approved_donations,
      (SELECT COUNT(*) FROM donations WHERE status='rejected') AS rejected_donations,
      (SELECT COUNT(*) FROM (
        SELECT LOWER(TRIM(reference_id)) AS normalized_reference
        FROM donations GROUP BY LOWER(TRIM(reference_id))
        HAVING COUNT(*) > 1
      )) AS duplicate_reference_groups,
      (SELECT COUNT(*) FROM donations d
        LEFT JOIN donation_reviews r ON r.donation_id=d.id
        WHERE d.status IN ('approved','rejected') AND r.id IS NULL
      ) AS finalized_without_review,
      (SELECT COUNT(*) FROM donations d
        LEFT JOIN donation_reviews r ON r.donation_id=d.id
        LEFT JOIN ticket_ledger l ON l.reason='payment' AND l.reference=CAST(d.id AS TEXT)
        WHERE (d.status='approved' AND (
          r.id IS NULL OR l.id IS NULL OR l.user_id IS NOT d.user_id
          OR ABS(l.delta-r.tickets)>0.000001
          OR (SELECT COUNT(*) FROM ticket_ledger lx WHERE lx.reason='payment' AND lx.reference=CAST(d.id AS TEXT))<>1
        )) OR (d.status<>'approved' AND l.id IS NOT NULL)
      ) AS donation_ledger_anomalies,
      (SELECT COUNT(*) FROM ticket_ledger l
        WHERE l.reason='payment' AND NOT EXISTS (
          SELECT 1 FROM donations d WHERE CAST(d.id AS TEXT)=l.reference
        )
      ) AS unmatched_payment_ledger_entries
    `).first(),
    db.prepare(`SELECT LOWER(TRIM(reference_id)) AS normalized_reference,
      COUNT(*) AS occurrence_count, GROUP_CONCAT(id) AS donation_ids
      FROM donations GROUP BY LOWER(TRIM(reference_id))
      HAVING COUNT(*) > 1 ORDER BY occurrence_count DESC LIMIT 100
    `).all(),
    db.prepare(`SELECT d.id AS donation_id,d.user_id,d.status,d.amount,d.reference_id,
      r.decision AS review_decision,r.tickets AS reviewed_tickets,
      COUNT(l.id) AS ledger_entries,MIN(l.user_id) AS ledger_user_id,
      MIN(l.delta) AS ledger_delta
      FROM donations d
      LEFT JOIN donation_reviews r ON r.donation_id=d.id
      LEFT JOIN ticket_ledger l ON l.reason='payment' AND l.reference=CAST(d.id AS TEXT)
      GROUP BY d.id
      HAVING (d.status='approved' AND (
        r.id IS NULL OR COUNT(l.id)<>1 OR MIN(l.user_id) IS NOT d.user_id
        OR ABS(MIN(l.delta)-r.tickets)>0.000001
      )) OR (d.status<>'approved' AND COUNT(l.id)>0)
      ORDER BY d.id DESC LIMIT 100
    `).all(),
    db.prepare(`SELECT l.id,l.user_id,l.delta,l.reference,l.created_at
      FROM ticket_ledger l
      WHERE l.reason='payment' AND NOT EXISTS (
        SELECT 1 FROM donations d WHERE CAST(d.id AS TEXT)=l.reference
      )
      ORDER BY l.id DESC LIMIT 100
    `).all()
  ]);
  return {
    read_only: true,
    summary: summary || {},
    duplicate_references: duplicateReferences.results || [],
    donation_anomalies: donationAnomalies.results || [],
    unmatched_payment_ledger: unmatchedLedger.results || []
  };
}
