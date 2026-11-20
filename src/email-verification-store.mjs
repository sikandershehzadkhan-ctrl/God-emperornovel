const HASH_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EMAIL_VERIFICATION_COMPLETION_SQL = [
  `UPDATE email_verification_tokens
    SET consumed_at=?, consumption_id=?
    WHERE token_hash=? AND purpose='email_verification'
      AND consumed_at IS NULL AND invalidated_at IS NULL AND expires_at>?
    RETURNING user_id,email_snapshot`,
  `UPDATE users SET email_verified_at=?
    WHERE id=(SELECT user_id FROM email_verification_tokens
      WHERE token_hash=? AND purpose='email_verification' AND consumption_id=?)
      AND lower(trim(email))=(SELECT lower(trim(email_snapshot)) FROM email_verification_tokens
      WHERE token_hash=? AND purpose='email_verification' AND consumption_id=?)`,
  `UPDATE email_verification_tokens SET invalidated_at=?
    WHERE user_id=(SELECT user_id FROM email_verification_tokens
      WHERE token_hash=? AND purpose='email_verification' AND consumption_id=?)
      AND token_hash<>? AND consumed_at IS NULL AND invalidated_at IS NULL`
];

/** Atomically consumes a token and verifies only the exact email snapshot it was issued for. */
export async function completeEmailVerification(db, { tokenHash, now }) {
  if (!db || typeof db.prepare !== "function" || typeof db.batch !== "function") throw new Error("A D1 database binding is required");
  if (typeof tokenHash !== "string" || !HASH_PATTERN.test(tokenHash)) throw new Error("Invalid email-verification token digest");
  if (typeof now !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(now)) throw new Error("A normalized UTC timestamp is required");
  const consumptionId = crypto.randomUUID();
  const bindings = [
    [now, consumptionId, tokenHash, now],
    [now, tokenHash, consumptionId, tokenHash, consumptionId],
    [now, tokenHash, consumptionId, tokenHash]
  ];
  const results = await db.batch(EMAIL_VERIFICATION_COMPLETION_SQL.map((sql,i)=>db.prepare(sql).bind(...bindings[i])));
  const consumed = results?.[0]?.results?.[0];
  if (!consumed || !Number.isSafeInteger(Number(consumed.user_id))) return { ok:false };
  if (Number(results?.[1]?.meta?.changes || 0) !== 1) return { ok:false, reason:"email_changed" };
  return { ok:true, userId:Number(consumed.user_id) };
}


const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export const EMAIL_VERIFICATION_ISSUANCE_SQL = [
  `UPDATE email_verification_tokens SET invalidated_at=?
    WHERE user_id=? AND consumed_at IS NULL AND invalidated_at IS NULL
      AND EXISTS (SELECT 1 FROM users WHERE id=? AND lower(trim(email))=lower(trim(?)) AND email_verified_at IS NULL)`,
  `INSERT INTO email_verification_tokens
    (user_id,email_snapshot,token_hash,purpose,created_at,expires_at)
    SELECT ?,?,?,'email_verification',?,?
    WHERE EXISTS (
      SELECT 1 FROM users WHERE id=? AND lower(trim(email))=? AND email_verified_at IS NULL
    )`
];
export const EMAIL_VERIFICATION_INVALIDATION_SQL = `UPDATE email_verification_tokens
  SET invalidated_at=?
  WHERE token_hash=? AND purpose='email_verification'
    AND consumed_at IS NULL AND invalidated_at IS NULL`;

/**
 * Atomically invalidates previous outstanding links and issues one new digest
 * for the exact current mailbox. D1 batch transactions make the invalidation
 * and insert indivisible.
 */
export async function issueEmailVerificationToken(db, {
  userId, emailSnapshot, tokenHash, now, expiresAt
} = {}) {
  if (!db || typeof db.prepare !== "function" || typeof db.batch !== "function") {
    throw new Error("A D1 database binding is required");
  }
  if (!Number.isSafeInteger(userId) || userId <= 0) throw new Error("A valid user id is required");
  const email = typeof emailSnapshot === "string" ? emailSnapshot.trim().toLowerCase() : "";
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) throw new Error("A valid email snapshot is required");
  if (typeof tokenHash !== "string" || !HASH_PATTERN.test(tokenHash)) throw new Error("Invalid email-verification token digest");
  if (typeof now !== "string" || !ISO_UTC.test(now) || typeof expiresAt !== "string" || !ISO_UTC.test(expiresAt)) {
    throw new Error("Normalized UTC timestamps are required");
  }
  const start = Date.parse(now), expiry = Date.parse(expiresAt);
  if (!Number.isFinite(start) || !Number.isFinite(expiry) || expiry <= start || expiry - start > 60 * 60 * 1000) {
    throw new Error("Email verification expiry must be within one hour");
  }
  const results = await db.batch([
    db.prepare(EMAIL_VERIFICATION_ISSUANCE_SQL[0]).bind(now,userId,userId,email),
    db.prepare(EMAIL_VERIFICATION_ISSUANCE_SQL[1]).bind(userId,email,tokenHash,now,expiresAt,userId,email)
  ]);
  if (Number(results?.[1]?.meta?.changes || 0) !== 1) return { ok:false };
  return { ok:true };
}

/** Revoke a specific undelivered token without affecting a newer request. */
export async function invalidateEmailVerificationToken(db, { tokenHash, now } = {}) {
  if (!db || typeof db.prepare !== "function") throw new Error("A D1 database binding is required");
  if (typeof tokenHash !== "string" || !HASH_PATTERN.test(tokenHash)) throw new Error("Invalid email-verification token digest");
  if (typeof now !== "string" || !ISO_UTC.test(now)) throw new Error("A normalized UTC timestamp is required");
  const result = await db.prepare(EMAIL_VERIFICATION_INVALIDATION_SQL).bind(now,tokenHash).run();
  return { ok:Number(result?.meta?.changes || 0) === 1 };
}
