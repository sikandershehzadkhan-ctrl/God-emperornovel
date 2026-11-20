const encoder = new TextEncoder();

const toBase64Url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)))
  .replaceAll("+", "-")
  .replaceAll("/", "_")
  .replaceAll("=", "");

const equalDigest = (left, right) => {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index++) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
};

/**
 * Creates a 256-bit password-reset secret.
 * The raw token is returned only to the caller for delivery through a verified channel.
 * Persist only tokenHash, never token.
 */
export function createPasswordResetToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return toBase64Url(bytes);
}

/** Return a SHA-256 base64url digest suitable for storage in D1. */
export async function hashPasswordResetToken(token) {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    throw new Error("Invalid password-reset token");
  }
  const bytes = Uint8Array.from(
    atob(token.replaceAll("-", "+").replaceAll("_", "/") + "="),
    character => character.charCodeAt(0)
  );
  if (bytes.length !== 32) throw new Error("Invalid password-reset token");
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  return toBase64Url(digest);
}

/** Compare a candidate token against a stored digest without early character exits. */
export async function verifyPasswordResetToken(token, expectedHash) {
  if (typeof expectedHash !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(expectedHash)) return false;
  let actual;
  try {
    actual = await hashPasswordResetToken(token);
  } catch {
    return false;
  }
  return equalDigest(actual, expectedHash);
}
