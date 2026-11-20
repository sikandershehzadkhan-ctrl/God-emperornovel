const encoder = new TextEncoder();
const toBase64Url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll("+","-").replaceAll("/","_").replaceAll("=","");
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function createEmailVerificationToken() {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function hashEmailVerificationToken(token) {
  if (typeof token !== "string" || !TOKEN_PATTERN.test(token)) throw new Error("Invalid email-verification token");
  const bytes = Uint8Array.from(atob(token.replaceAll("-","+").replaceAll("_","/")+"="), c => c.charCodeAt(0));
  if (bytes.length !== 32) throw new Error("Invalid email-verification token");
  return toBase64Url(await crypto.subtle.digest("SHA-256", encoder.encode(token)));
}

export async function verifyEmailVerificationToken(token, expectedHash) {
  if (typeof expectedHash !== "string" || !TOKEN_PATTERN.test(expectedHash)) return false;
  let actual;
  try { actual = await hashEmailVerificationToken(token); } catch { return false; }
  let mismatch = 0;
  for (let i=0;i<actual.length;i++) mismatch |= actual.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  return mismatch === 0;
}
