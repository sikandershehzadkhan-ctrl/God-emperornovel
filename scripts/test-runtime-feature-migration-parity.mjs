import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(new URL("../migrations/0012_runtime_feature_schema.sql", import.meta.url), "utf8");
const reports = await readFile(new URL("../migrations/0019_comment_report_uniqueness.sql", import.meta.url), "utf8");
const runtime = await readFile(new URL("../src/runtime-feature-schema.mjs", import.meta.url), "utf8");
const m8 = await readFile(new URL("../migrations/0008_discovery_community.sql", import.meta.url), "utf8");

for (const table of ["auth_rate_limits", "comment_likes", "novel_reactions", "request_votes"]) {
  assert.match(migration, new RegExp("CREATE TABLE IF NOT EXISTS " + table));
  assert.match(runtime, new RegExp("CREATE TABLE IF NOT EXISTS " + table));
}
for (const index of ["idx_auth_rate_limits_window", "idx_comment_likes_comment", "idx_novel_reactions_novel", "idx_request_votes_request"]) {
  assert.ok(migration.includes(index), index + " must exist in fresh-install migration");
}
assert.match(migration, /ALTER TABLE comments ADD COLUMN parent_id INTEGER/);
assert.match(migration, /ALTER TABLE comments ADD COLUMN edited_at TEXT/);
assert.match(runtime, /parent_id INTEGER/);
assert.match(runtime, /edited_at TEXT/);
assert.match(m8, /CREATE TABLE IF NOT EXISTS request_votes/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS request_votes/,
  "phase 01N.12 must defensively converge with the earlier request-votes table");
assert.match(reports, /CREATE TABLE IF NOT EXISTS comment_reports/);
assert.match(reports, /CREATE UNIQUE INDEX IF NOT EXISTS idx_comment_reports_user_comment/);
assert.doesNotMatch(migration, /comment_reports_legacy_duplicates|DELETE FROM comment_reports|CREATE TRIGGER.*comment_reports/i,
  "migration 0012 must not conflict with report-evidence policy owned by 0019");
assert.doesNotMatch(migration, /CREATE TABLE IF NOT EXISTS comment_reports/,
  "comment-report table and uniqueness are owned by migration 0019");
console.log("PASS: migration 0012 covers runtime feature tables and comment columns; report evidence and uniqueness remain owned by 0019.");
