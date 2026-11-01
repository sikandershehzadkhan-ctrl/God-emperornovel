const HASH_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const PASSWORD_HASH_PATTERN = /^pbkdf2-sha256\$\d+\$[A-Za-z0-9_-]{20,32}\$[A-Za-z0-9_-]{40,64}$/;

/**
 * Atomically consumes a reset token, updates its account password, revokes
 * that account's sessions, and invalidates its other outstanding reset tokens.
 *
 * Requires a D1 database binding. D1 batch executes the statements sequentially
 * inside one transaction; if any statement fails, the batch is rolled back.
 * This helper is deliberately not wired to an HTTP route until email delivery
 * and end-to-end abuse controls are configured.
 */
export const PASSWORD_RESET_COMPLETION_SQL = [
  `UPDATE password_reset_tokens
    SET consumed_at=?
    WHERE token_hash=? AND purpose='password_reset'
      AND consumed_at IS NULL AND invalidated_at IS NULL AND expires_at>?
    RETURNING user_id`,
  `UPDATE users SET password_hash=?
    WHERE id=(SELECT user_id FROM password_reset_tokens
      WHERE token_hash=? AND purpose='password_reset' AND consumed_at=?)`,
  `DELETE FROM sessions
    WHERE user_id=(SELECT user_id FROM password_reset_tokens
      WHERE token_hash=? AND purpose='password_reset' AND consumed_at=?)`,
  `UPDATE password_reset_tokens SET invalidated_at=?
    WHERE user_id=(SELECT user_id FROM password_reset_tokens
      WHERE token_hash=? AND purpose='password_reset' AND consumed_at=?)
      AND token_hash<>? AND consumed_at IS NULL AND invalidated_at IS NULL`
];

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

  const bindings = [
    [now, tokenHash, now],
    [passwordHash, tokenHash, now],
    [tokenHash, now],
    [now, tokenHash, now, tokenHash]
  ];
  const results = await db.batch(PASSWORD_RESET_COMPLETION_SQL.map((sql, index) =>
    db.prepare(sql).bind(...bindings[index])
  ));
  const consumed = results?.[0]?.results?.[0];
  if (!consumed || !Number.isSafeInteger(Number(consumed.user_id))) return { ok: false };
  return { ok: true, userId: Number(consumed.user_id) };
}
