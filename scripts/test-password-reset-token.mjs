import assert from "node:assert/strict";
import {
  createPasswordResetToken,
  hashPasswordResetToken,
  verifyPasswordResetToken
} from "../src/password-reset-token.mjs";

const first = createPasswordResetToken();
const second = createPasswordResetToken();

assert.match(first, /^[A-Za-z0-9_-]{43}$/);
assert.match(second, /^[A-Za-z0-9_-]{43}$/);
assert.notEqual(first, second, "Reset tokens must use fresh cryptographic randomness");

const firstHash = await hashPasswordResetToken(first);
assert.match(firstHash, /^[A-Za-z0-9_-]{43}$/);
assert.notEqual(first, firstHash, "Only a digest, never the raw token, is suitable for persistence");
assert.equal(await verifyPasswordResetToken(first, firstHash), true);
assert.equal(await verifyPasswordResetToken(second, firstHash), false);
assert.equal(await verifyPasswordResetToken("malformed", firstHash), false);
assert.equal(await verifyPasswordResetToken(first, "not-a-digest"), false);
await assert.rejects(() => hashPasswordResetToken("x".repeat(43)), /Invalid password-reset token/);
await assert.rejects(() => hashPasswordResetToken(""), /Invalid password-reset token/);

console.log("PASS: 256-bit password-reset token generation, digest storage, and verification.");
