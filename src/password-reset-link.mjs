const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/**
 * Build a reset link only from an explicitly configured canonical HTTPS origin.
 * The secret is placed in the URL fragment so it is not sent in the HTTP request
 * path/query or ordinary server access logs. Reset pages must not load third-party
 * scripts, analytics, images, or other external resources.
 */
export function createPasswordResetLink(token, configuredOrigin) {
  if (typeof token !== "string" || !TOKEN_PATTERN.test(token)) {
    throw new Error("Invalid password-reset token");
  }
  if (typeof configuredOrigin !== "string" || !configuredOrigin.trim()) {
    throw new Error("Password-reset public origin is not configured");
  }

  let origin;
  try {
    origin = new URL(configuredOrigin);
  } catch {
    throw new Error("Password-reset public origin is invalid");
  }
  if (
    origin.protocol !== "https:" ||
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash ||
    origin.origin !== configuredOrigin
  ) {
    throw new Error("Password-reset public origin must be a canonical HTTPS origin");
  }

  const link = new URL("/reset-password", origin.origin);
  link.hash = "token=" + encodeURIComponent(token);
  return link.toString();
}
