import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync(new URL("../migrations/0009_password_reset_tokens.sql", import.meta.url), "utf8");
const normalized = migration
  .split(String.fromCharCode(10))
  .filter(line => !line.trimStart().startsWith("--"))
  .join(" ")
  .toLowerCase()
  .replaceAll("  ", " ");

for (const required of [
  "create table if not exists password_reset_tokens",
  "user_id integer not null",
  "token_hash text not null unique",
  "purpose text not null check (purpose = 'password_reset')",
  "expires_at text not null",
  "consumed_at text",
  "consumption_id text unique",
  "invalidated_at text",
  "foreign key(user_id) references users(id) on delete cascade",
  "idx_password_reset_tokens_user_created",
  "idx_password_reset_tokens_expiry",
  "where consumed_at is null and invalidated_at is null"
]) {
  assert.ok(normalized.includes(required), "Missing migration requirement: " + required);
}
assert.ok(!normalized.includes("raw_token"), "Raw reset tokens must not be persisted");
assert.ok(!normalized.includes("password text"), "Plaintext passwords must not be persisted");

console.log("PASS: password reset D1 migration stores only purpose-bound token digests.");
