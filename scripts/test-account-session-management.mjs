import assert from "node:assert/strict";
import fs from "node:fs";

const worker = fs.readFileSync("src/index.js", "utf8");
const app = fs.readFileSync("public/app.js", "utf8");
const versionedApp = fs.readFileSync("public/app-17.24.0.js", "utf8");

const listStart = worker.indexOf('if(p==="/api/account/sessions"&&m==="GET")');
const revokeStart = worker.indexOf('if(p==="/api/account/sessions/revoke-others"&&m==="POST")');
const passwordStart = worker.indexOf('if(p==="/api/account/password"&&m==="POST")');
const profileStart = worker.indexOf('if(p==="/api/profile"&&m==="GET")');
assert.ok(listStart >= 0 && revokeStart > listStart && passwordStart > revokeStart && profileStart > passwordStart, "Account security routes must be registered before profile routes.");

const listRoute = worker.slice(listStart, revokeStart);
for (const guard of [
  "need(u)",
  "cookies(req.headers.get(\"cookie\"))",
  "digest(c.session)",
  "WHERE user_id=? AND expires_at>?",
  "current:row.token_hash===currentHash"
]) assert.ok(listRoute.includes(guard), "Session listing missing guard: " + guard);
assert.ok(!listRoute.includes("token_hash:"), "Session token hashes must never be returned in the response projection.");

const revokeRoute = worker.slice(revokeStart, passwordStart);
for (const guard of [
  "need(u)",
  "origin!==url.origin",
  "sec-fetch-site",
  'consumeAuthRateLimit(env,"session-revoke"',
  "verifyPassword(password,account.password_hash)",
  "DELETE FROM sessions WHERE user_id=? AND token_hash<>?",
  'audit(env,u,"account.sessions_revoked"'
]) assert.ok(revokeRoute.includes(guard), "Session revocation missing guard: " + guard);

const passwordRoute = worker.slice(passwordStart, profileStart);
for (const guard of [
  "need(u)",
  "origin!==url.origin",
  "sec-fetch-site",
  'consumeAuthRateLimit(env,"password-change"',
  "verifyPassword(currentPassword,account.password_hash)",
  "verifyPassword(newPassword,account.password_hash)",
  "newPassword!==confirmPassword",
  "hashPassword(newPassword)",
  "WHERE id=? AND password_hash=?",
  "DELETE FROM sessions WHERE user_id=? AND token_hash<>?",
  'audit(env,u,"account.password_changed"'
]) assert.ok(passwordRoute.includes(guard), "Password change missing guard: " + guard);

assert.ok(app.includes('id="accountSessions"'), "Profile page must display active sessions.");
assert.ok(app.includes('id="revokeSessionsForm"'), "Profile page must expose a re-authenticated revoke form.");
assert.ok(app.includes('id="changePasswordForm"'), "Profile page must expose a password change form.");
assert.ok(app.includes("fields.new_password!==fields.confirm_password"), "Profile UI must compare password confirmation before submitting.");
assert.ok(app.includes('name="confirm_password"'), "Password change must require confirmation.");
assert.ok(app.includes("api('/api/account/sessions')"), "Profile page must load session inventory.");
assert.ok(app.includes("api('/api/account/sessions/revoke-others'"), "Profile page must call the protected revocation endpoint.");
assert.ok(app.includes("api('/api/account/password'"), "Profile page must call the password change endpoint.");
assert.ok(app.includes("Showing the 20 most recent sessions"), "Session inventory must disclose its display bound.");
assert.equal(app, versionedApp, "Source and active served application bundles must be byte-identical.");

console.log("Account session inventory, password rotation, re-authenticated revocation, privacy, and bundle checks passed.");
