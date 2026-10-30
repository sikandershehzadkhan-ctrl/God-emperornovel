const ITERATIONS = 120000;
const encoder = new TextEncoder();

const toBase64Url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)))
  .replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");

const fromBase64Url = value => {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid base64url value");
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
  return Uint8Array.from(atob(padded), char => char.charCodeAt(0));
};

const constantTimeEqual = (left, right) => {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return difference === 0;
};

async function derive(password, salt, iterations) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  return toBase64Url(await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256
  ));
}

export async function hashPassword(password) {
  if (typeof password !== "string" || password.length < 8 || password.length > 1024) {
    throw new Error("Password must be between 8 and 1024 characters");
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encodedSalt = toBase64Url(salt);
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2-sha256$${ITERATIONS}$${encodedSalt}$${hash}`;
}

export async function verifyPassword(password, stored) {
  if (typeof password !== "string" || typeof stored !== "string") return false;
  const parts = stored.split(":");
  if (parts.length === 2) {
    const [legacyHash, legacySalt] = parts;
    if (!/^[A-Za-z0-9_-]{20,64}$/.test(legacySalt) || !/^[A-Za-z0-9_-]{40,64}$/.test(legacyHash)) return false;
    const actual = toBase64Url(await crypto.subtle.digest("SHA-256", encoder.encode(password + ":" + legacySalt)));
    return constantTimeEqual(actual, legacyHash);
  }

  if (password.length > 1024) return false;
  const [algorithm, iterationText, saltText, expected, ...extra] = stored.split("$");
  if (algorithm !== "pbkdf2-sha256" || extra.length || !/^\d+$/.test(iterationText)) return false;
  const iterations = Number(iterationText);
  if (!Number.isSafeInteger(iterations) || iterations < 100000 || iterations > 600000) return false;
  if (!/^[A-Za-z0-9_-]{20,32}$/.test(saltText) || !/^[A-Za-z0-9_-]{40,64}$/.test(expected)) return false;
  let salt;
  try { salt = fromBase64Url(saltText); } catch { return false; }
  if (salt.length !== 16) return false;
  const actual = await derive(password, salt, iterations);
  return constantTimeEqual(actual, expected);
}

export const PASSWORD_HASH_ITERATIONS = ITERATIONS;
