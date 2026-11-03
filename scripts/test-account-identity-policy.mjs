import assert from "node:assert/strict";
import fs from "node:fs";
import { validateUsernameChange } from "../src/account-identity-policy.mjs";

assert.deepEqual(validateUsernameChange({ username: "Sikander_24" }, "oldname"), {
  ok: true, value: "Sikander_24"
});
for (const username of ["ab", "a".repeat(25), "two words", "admin", "API", "../root", "user-name"]) {
  assert.equal(validateUsernameChange({ username }, "oldname").ok, false, username);
}
assert.equal(validateUsernameChange({ username: "OldName" }, "oldname").ok, false);
assert.equal(validateUsernameChange({ username: ["admin"] }, "oldname").ok, false);

const migration = fs.readFileSync("migrations/0017_username_change_cooldown.sql", "utf8");
assert.match(migration, /username_changed_at TEXT NOT NULL DEFAULT ''/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS username_history/);
assert.match(migration, /trg_users_username_history/);
assert.match(migration, /idx_username_history_global/);
assert.match(migration, /trg_users_reject_historical_username_reuse/);
assert.match(migration, /trg_users_reject_casefold_username_collision/);

assert.match(migration, /AFTER UPDATE OF username ON users/);

const worker = fs.readFileSync("src/index.js", "utf8");
const changeRouteStart = worker.indexOf('if(p==="/api/account/username"&&m==="POST")');
const profileRouteStart = worker.indexOf('if(p==="/api/profile"&&m==="GET")');
assert.ok(changeRouteStart >= 0 && profileRouteStart > changeRouteStart, "Identity change route must be registered.");
const changeRoute = worker.slice(changeRouteStart, profileRouteStart);
for (const guard of ["verifyPassword(password,account.password_hash)", "username_changed_at", "julianday('now')", "consumeAuthRateLimit", "sec-fetch-site", "account.username_changed"]) {
  assert.ok(changeRoute.includes(guard), "Missing account identity security guard: " + guard);
}
assert.ok(worker.includes("SELECT LOWER(old_username) FROM username_history WHERE user_id=?"), "Author listings must retain historical usernames.");
assert.ok(worker.includes("old_username=? COLLATE NOCASE AND user_id<>?"), "Historical usernames must not be reassigned to a different account.");
assert.ok(worker.includes("owner_user_id=?"), "Author works must be attached to account ownership.");
assert.ok(worker.includes("owner_user_id IS NULL AND (LOWER(author)"), "Legacy author-name matching must never reveal works owned by another account.");

const app = fs.readFileSync("public/app.js", "utf8");
const versionedApp = fs.readFileSync("public/app-17.24.0.js", "utf8");
assert.equal(app, versionedApp, "Served and source app bundles must remain byte-identical.");
assert.ok(app.includes('id="usernameChangeForm"'), "Profile page must expose the username change form.");
assert.ok(app.includes("api('/api/account/username'"), "Username form must call the protected endpoint.");
assert.ok(app.includes("autocomplete=\"current-password\""), "Username form must request current-password re-authentication.");
assert.ok(app.includes("Email changes are temporarily unavailable"), "Unavailable email verification must be clearly disclosed.");
assert.ok(app.includes("Avatar uploads are pending secure media storage configuration"), "Unavailable avatar storage must be clearly disclosed.");
console.log("Account identity policy, cooldown migration, author continuity, and UI checks passed.");
