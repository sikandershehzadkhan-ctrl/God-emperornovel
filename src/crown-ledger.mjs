// Crown balance changes and unlock grants must be one conditional D1 batch.
// SQLite changes() gates each dependent write on the preceding successful statement.
export async function spendAndUnlockChapter(db, userId, chapterId, cost) {
  const uid = Number(userId), cid = Number(chapterId), amount = Number(cost);
  if (!Number.isSafeInteger(uid) || uid < 1 || !Number.isSafeInteger(cid) || cid < 1 ||
      !Number.isFinite(amount) || amount < 0) {
    throw new TypeError("Invalid Crown transaction");
  }
  const results = await db.batch([
    db.prepare("UPDATE users SET tickets=tickets-? WHERE id=? AND tickets>=? AND NOT EXISTS (SELECT 1 FROM unlocks WHERE user_id=? AND chapter_id=?)")
      .bind(amount, uid, amount, uid, cid),
    db.prepare("INSERT INTO unlocks(user_id,chapter_id,cost) SELECT ?,?,? WHERE changes()=1")
      .bind(uid, cid, amount),
    db.prepare("INSERT INTO ticket_ledger(user_id,delta,reason,reference) SELECT ?,?,?,? WHERE changes()=1")
      .bind(uid, -amount, "chapter_unlock", String(cid))
  ]);
  const changed = Number(results?.[0]?.meta?.changes ?? results?.[0]?.changes ?? 0);
  const [balance, existing] = await Promise.all([
    db.prepare("SELECT tickets FROM users WHERE id=?").bind(uid).first(),
    db.prepare("SELECT 1 AS found FROM unlocks WHERE user_id=? AND chapter_id=?").bind(uid, cid).first()
  ]);
  if (changed === 1) return { ok: true, alreadyUnlocked: false, tickets: Number(balance?.tickets ?? 0) };
  if (existing) return { ok: true, alreadyUnlocked: true, tickets: Number(balance?.tickets ?? 0) };
  return { ok: false, reason: "insufficient", tickets: Number(balance?.tickets ?? 0) };
}
