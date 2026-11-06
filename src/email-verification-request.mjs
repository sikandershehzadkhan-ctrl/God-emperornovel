import { createEmailVerificationToken, hashEmailVerificationToken } from "./email-verification-token.mjs";
import { issueEmailVerificationToken, invalidateEmailVerificationToken } from "./email-verification-store.mjs";
import { deliverSecurityEmail } from "./security-email-delivery.mjs";

/**
 * Coordinates verification issuance and delivery without exposing the bearer token.
 * No provider binding means no token is issued and no prior link is invalidated.
 */
export async function requestEmailVerification({ db, env, user, publicOrigin, now = new Date().toISOString() } = {}) {
  if (!env?.SECURITY_EMAIL || typeof env.SECURITY_EMAIL.fetch !== "function") {
    return { ok:false, reason:"unavailable" };
  }
  if (!user || !Number.isSafeInteger(Number(user.id)) || Number(user.id) <= 0 ||
      typeof user.email !== "string" || !user.email.trim() ||
      user.email_verified_at) {
    return { ok:false, reason:"unavailable" };
  }

  let origin;
  try { origin = new URL(publicOrigin); } catch { return { ok:false, reason:"unavailable" }; }
  if (origin.protocol !== "https:" || origin.username || origin.password ||
      origin.pathname !== "/" || origin.search || origin.hash || origin.origin !== publicOrigin) {
    return { ok:false, reason:"unavailable" };
  }

  const token = createEmailVerificationToken();
  const tokenHash = await hashEmailVerificationToken(token);
  const issuedAt = new Date(now);
  if (!Number.isFinite(issuedAt.getTime())) return { ok:false, reason:"unavailable" };
  const createdAt = issuedAt.toISOString();
  const expiresAt = new Date(issuedAt.getTime() + 30 * 60 * 1000).toISOString();
  const issued = await issueEmailVerificationToken(db, {
    userId:Number(user.id), emailSnapshot:user.email, tokenHash, now:createdAt, expiresAt
  });
  if (!issued.ok) return { ok:false, reason:"unavailable" };

  const action = new URL("/verify-email", origin.origin);
  action.hash = "token=" + token;
  const delivered = await deliverSecurityEmail(env, {
    template:"verify_email",
    recipient:user.email,
    actionUrl:action.toString(),
    publicOrigin:origin.origin,
    idempotencyKey:crypto.randomUUID()
  });
  if (!delivered.ok) {
    try {
      await invalidateEmailVerificationToken(db,{tokenHash,now:new Date().toISOString()});
    } catch {
      // Do not log or expose bearer tokens, recipient addresses, or provider errors.
    }
    return { ok:false, reason:"unavailable" };
  }
  return { ok:true };
}
