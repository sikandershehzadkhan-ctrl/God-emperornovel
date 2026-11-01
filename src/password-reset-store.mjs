const HASH_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const PASSWORD_HASH_PATTERN = /^pbkdf2-sha256\$\d+\$[A-Za-z0-9_-]{20,32}\$[A-Za-z0-9_-]{40,64}$/;

export const PASSWORD_RESET_COMPLETION_SQL = [
  `UPDATE password_reset_tokens
    SET consumed_at=?, consumption_id=?
    WHERE token_hash=? AND purpose='password_reset'
      AND consumed_at IS NULL AND invalidated_at IS NULL AND expires_at>?
    RETURNING user_id`,
  `UPDATE users SET password_hash=?
    WHERE id=(SELECT user_id FROM password_reset_tokens
      WHERE token_hash=? AND purpose='password_reset' AND consumption_id=?)`,
  `DELETE FROM sessions
    WHERE user_id=(SELECT user_id FROM password_reset_tokens
      WHERE token_hash=? AND purpose='password_reset' AND consumption_id=?)`,
  `UPDATE password_reset_tokens SET invalidated_at=?
    WHERE user_id=(SELECT user_id FROM password_reset_tokens
      WHERE token_hash=? AND purpose='password_reset' AND consumption_id=?)
      AND token_hash<>? AND consumed_at IS NULL AND invalidated_at IS NULL`
];

/**
 * Consumes one reset token and changes only its account's password.
 * D1 batch provides the transaction boundary. A fresh UUID binds every
 * subsequent statement to this exact successful consumption, avoiding
 * timestamp-collision replay across concurrent or repeated requests.
 */
export async function completePasswordReset(db, { tokenHash, passwordHash, now }) {
  if (!db || typeof db.prepare !== "function" || typeof db.batch !== "function") {
    throw new Error("A D1 database binding is required");
  }
  if (typeof tokenHash !== "string" || !HASH_PATTERN.test(tokenHash)) {
    throw new Error("Invalid password-reset token digest");
  }
  if (typeof passwordHash !== "string" || !PASSWORD_HASH_PATTERN.test(passwordHash)) {
    throw new Error("Invalid password hash");
  }
  if (typeof now !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(now)) {
    throw new Error("A normalized UTC timestamp is required");
  }

  const consumptionId = crypto.randomUUID();
  const bindings = [
    [now, consumptionId, tokenHash, now],
    [passwordHash, tokenHash, consumptionId],
    [tokenHash, consumptionId],
    [now, tokenHash, consumptionId, tokenHash]
  ];
  const results = await db.batch(PASSWORD_RESET_COMPLETION_SQL.map((sql, index) =>
    db.prepare(sql).bind(...bindings[index])
  ));
  const consumed = results?.[0]?.results?.[0];
  if (!consumed || !Number.isSafeInteger(Number(consumed.user_id))) return { ok: false };
  return { ok: true, userId: Number(consumed.user_id) };
}
