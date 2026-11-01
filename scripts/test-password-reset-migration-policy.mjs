import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync(new URL("../migrations/0009_password_reset_tokens.sql", import.meta.url), "utf8");
const normalized = migration.replace(/--[^\n]*/g, "").replace(/\s+/g, " ").toLowerCase();

assert.match(normalized, /create table if not exists password_reset_tokens/);
assert.match(normalized, /user_id integer not null/);
assert.match(normalized, /token_hash text not null unique/);
assert.match(normalized, /purpose text not null check \(purpose = 'password_reset'\)/);
assert.match(normalized, /expires_at text not null/);
assert.match(normalized, /consumed_at text/);
assert.match(normalized, /invalidated_at text/);
assert.match(normalized, /idx_password_reset_tokens_user_created/);
assert.match(normalized, /idx_password_reset_tokens_expiry/);
assert.match(normalized, /where consumed_at is null and invalidated_at is null/);
assert.doesNotMatch(normalized, /token text/);
assert.doesNotMatch(normalized, /raw_token/);
assert.doesNotMatch(normalized, /password text/);

console.log("PASS: password reset D1 migration stores only purpose-bound token digests.");
