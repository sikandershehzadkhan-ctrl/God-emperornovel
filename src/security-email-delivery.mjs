const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_TEMPLATES = new Set(["verify_email", "reset_password"]);

/**
 * Send security mail through an explicitly configured Cloudflare Service Binding.
 * The binding's receiving Worker owns provider credentials and provider-specific
 * delivery. This application never receives or stores those credentials.
 *
 * Expected binding contract:
 *   env.SECURITY_EMAIL.fetch(POST https://security-email.internal/v1/send)
 *   JSON: { template, recipient, action_url, idempotency_key }
 * Expected successful response: HTTP 2xx with JSON { ok: true }.
 *
 * Failure is deliberately generic. Do not log request bodies, action URLs,
 * recipient addresses, provider responses, or thrown exception details here.
 */
export async function deliverSecurityEmail(env, {
  template,
  recipient,
  actionUrl,
  idempotencyKey
} = {}) {
  const email = typeof recipient === "string" ? recipient.trim().toLowerCase() : "";
  if (!ALLOWED_TEMPLATES.has(template)) return { ok: false, reason: "invalid_message" };
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return { ok: false, reason: "invalid_message" };
  if (typeof actionUrl !== "string" || actionUrl.length > 2048) return { ok: false, reason: "invalid_message" };
  if (typeof idempotencyKey !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    return { ok: false, reason: "invalid_message" };
  }

  let link;
  try { link = new URL(actionUrl); } catch { return { ok: false, reason: "invalid_message" }; }
  if (link.protocol !== "https:" || link.username || link.password || link.search) {
    return { ok: false, reason: "invalid_message" };
  }
  if (!env?.SECURITY_EMAIL || typeof env.SECURITY_EMAIL.fetch !== "function") {
    return { ok: false, reason: "unavailable" };
  }

  const payload = {
    template,
    recipient: email,
    action_url: link.toString(),
    idempotency_key: idempotencyKey
  };
  try {
    const response = await env.SECURITY_EMAIL.fetch(new Request(
      "https://security-email.internal/v1/send",
      {
        method: "POST",
        headers: { "content-type": "application/json", "cache-control": "no-store" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000)
      }
    ));
    if (!response.ok) return { ok: false, reason: "unavailable" };
    const result = await response.json().catch(() => null);
    if (result?.ok !== true) return { ok: false, reason: "unavailable" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
