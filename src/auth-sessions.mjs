// Keep session revocation logic small and independently testable.
export async function revokeOtherSessions(db, userId, currentTokenHash) {
  if (!db || !Number.isSafeInteger(Number(userId)) || Number(userId) <= 0) {
    throw new TypeError("A valid user ID is required");
  }
  if (typeof currentTokenHash !== "string" || currentTokenHash.length < 20) {
    throw new TypeError("A valid current session hash is required");
  }
  const result = await db.prepare(
    "DELETE FROM sessions WHERE user_id=? AND token_hash<>?"
  ).bind(Number(userId), currentTokenHash).run();
  return Number(result?.meta?.changes ?? result?.changes ?? 0);
}
