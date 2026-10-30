import assert from "node:assert/strict";
import { hashPassword, verifyPassword, PASSWORD_HASH_ITERATIONS } from "../src/auth-password.mjs";

const password = "ImperialNovel-Test-Password-2026!";
const first = await hashPassword(password);
const second = await hashPassword(password);

assert.equal(PASSWORD_HASH_ITERATIONS, 120000);
assert.match(first, /^pbkdf2-sha256\$120000\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/);
assert.notEqual(first, second, "Each password hash must use a fresh random salt");
assert.equal(await verifyPassword(password, first), true);
assert.equal(await verifyPassword("incorrect-password", first), false);
assert.equal(await verifyPassword(password, "malformed"), false);
assert.equal(await verifyPassword(password, "pbkdf2-sha256$1$bad$bad"), false);

const legacySalt = "legacySaltForTest123";
const legacyDigest = await crypto.subtle.digest(
  "SHA-256",
  new TextEncoder().encode(password + ":" + legacySalt)
);
const legacyHash = btoa(String.fromCharCode(...new Uint8Array(legacyDigest)))
  .replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
const legacyStored = legacyHash + ":" + legacySalt;
assert.equal(await verifyPassword(password, legacyStored), true, "Legacy accounts must remain able to sign in");
assert.equal(await verifyPassword("incorrect-password", legacyStored), false);
const longLegacyPassword = "L".repeat(1100);
const longLegacyDigest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(longLegacyPassword + ":" + legacySalt));
const longLegacyHash = btoa(String.fromCharCode(...new Uint8Array(longLegacyDigest))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
assert.equal(await verifyPassword(longLegacyPassword, longLegacyHash + ":" + legacySalt), true, "Legacy accounts with older long passwords remain compatible");

await assert.rejects(() => hashPassword("short"), /between 8 and 1024/);
await assert.rejects(() => hashPassword("x".repeat(1025)), /between 8 and 1024/);
console.log("PASS: PBKDF2 hashing, random salts, legacy compatibility, invalid formats, and password bounds.");
