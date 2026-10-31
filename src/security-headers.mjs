/**
 * Central response security-header policy for Imperial Novel.
 *
 * Kept as a small pure helper so it can be applied consistently to Worker
 * responses without mutating the original Response. CSP is report-only until
 * every inline script/style and third-party integration has been inventoried.
 */
const POLICY = Object.freeze({
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Content-Security-Policy-Report-Only": [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: https:",
    "font-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline' https:",
    "script-src 'self' 'unsafe-inline' https:",
    "connect-src 'self' https:",
    "upgrade-insecure-requests"
  ].join("; ")
});

export function withSecurityHeaders(response, request) {
  if (!(response instanceof Response)) throw new TypeError("A Response is required");
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(POLICY)) {
    if (!headers.has(name)) headers.set(name, value);
  }
  const protocol = new URL(request.url).protocol;
  if (protocol === "https:" && !headers.has("Strict-Transport-Security")) {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export const SECURITY_HEADER_POLICY = POLICY;
