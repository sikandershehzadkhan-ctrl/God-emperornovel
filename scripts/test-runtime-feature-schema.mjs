import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRuntimeFeatureSchemaEnsurer } from "../src/runtime-feature-schema.mjs";

function fakeDb(marker) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      calls.push(sql);
      return {
        bind() { return this; },
        async first() { return marker; },
        async run() { return { meta: { changes: 0 } }; }
      };
    }
  };
}

const fastDb = fakeDb({ value: "2" });
await createRuntimeFeatureSchemaEnsurer()({ DB: fastDb });
assert.equal(fastDb.calls.length, 1, "current schema marker must keep the fast path");
assert.match(fastDb.calls[0], /runtime_feature_schema_version/);

const coldDb = fakeDb(null);
await createRuntimeFeatureSchemaEnsurer()({ DB: coldDb });
for (const table of ["auth_rate_limits", "comment_likes", "comment_reports", "novel_reactions", "request_votes"]) {
  assert.ok(coldDb.calls.some(sql => sql.includes("CREATE TABLE IF NOT EXISTS " + table)), table + " must be initialized");
}
assert.ok(coldDb.calls.some(sql => sql.includes("UNIQUE(user_id,comment_id)")),
  "new comment report tables must enforce one report per user/comment");
assert.ok(coldDb.calls.some(sql => sql.includes("idx_comment_reports_user_comment")),
  "existing comment report tables need a unique index");
const archiveAt = coldDb.calls.findIndex(sql => sql.includes("CREATE TABLE IF NOT EXISTS comment_reports_legacy_duplicates"));
const archiveCopyAt = coldDb.calls.findIndex(sql => sql.includes("INSERT OR IGNORE INTO comment_reports_legacy_duplicates"));
const dedupeAt = coldDb.calls.findIndex(sql => sql.includes("DELETE FROM comment_reports"));
const uniqueIndexAt = coldDb.calls.findIndex(sql => sql.includes("idx_comment_reports_user_comment"));
assert.ok(archiveAt >= 0 && archiveCopyAt > archiveAt && dedupeAt > archiveCopyAt && uniqueIndexAt > dedupeAt,
  "legacy duplicate reports must be archived before deduplication and uniqueness enforcement");
for (const trigger of [
  "trg_comment_likes_validate_insert", "trg_comment_likes_validate_update",
  "trg_comment_likes_user_cascade", "trg_comment_likes_comment_cascade",
  "trg_comment_reports_validate_insert", "trg_comment_reports_validate_update",
  "trg_comment_reports_user_cascade", "trg_comment_reports_comment_cascade",
  "trg_novel_reactions_validate_insert", "trg_novel_reactions_validate_update",
  "trg_novel_reactions_user_cascade", "trg_novel_reactions_novel_cascade",
  "trg_request_votes_validate_insert", "trg_request_votes_validate_update",
  "trg_request_votes_user_cascade", "trg_request_votes_request_cascade"
]) {
  assert.ok(coldDb.calls.some(sql => sql.includes("CREATE TRIGGER IF NOT EXISTS " + trigger)),
    trigger + " must enforce referential integrity for pre-existing tables");
}
assert.ok(coldDb.calls.some(sql => sql.includes("FOREIGN KEY(comment_id) REFERENCES comments(id)")),
  "comment engagement tables must cascade with deleted comments");
assert.ok(coldDb.calls.some(sql => sql.includes("ALTER TABLE comments ADD COLUMN parent_id INTEGER")));
assert.ok(coldDb.calls.some(sql => sql.includes("DELETE FROM auth_rate_limits")));
assert.match(coldDb.calls.at(-1), /runtime_feature_schema_version.*'2'/);

const migration = await readFile(new URL("../migrations/0012_runtime_feature_schema.sql", import.meta.url), "utf8");
const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
for (const table of ["auth_rate_limits", "comment_likes", "comment_reports", "novel_reactions", "request_votes"]) {
  assert.match(migration, new RegExp("CREATE TABLE IF NOT EXISTS " + table));
}
assert.match(migration, /idx_comment_reports_user_comment/);
assert.match(migration, /INSERT OR IGNORE INTO comment_reports_legacy_duplicates/);
assert.ok(migration.indexOf("INSERT OR IGNORE INTO comment_reports_legacy_duplicates") < migration.indexOf("DELETE FROM comment_reports"),
  "migration must preserve legacy report records before removing duplicates");
assert.match(migration, /FOREIGN KEY\(comment_id\) REFERENCES comments\(id\) ON DELETE CASCADE/);
assert.match(migration, /CREATE TRIGGER IF NOT EXISTS trg_request_votes_request_cascade/);
assert.match(migration, /CREATE TRIGGER IF NOT EXISTS trg_comment_reports_validate_insert/);
assert.match(worker, /INSERT OR IGNORE INTO comment_likes/,
  "concurrent duplicate likes must not surface as database errors");
assert.match(worker, /You have already reported this comment/);
assert.match(worker, /UNIQUE constraint failed/,
  "duplicate report races must return a conflict instead of HTTP 500");

console.log("PASS: runtime feature schema upgrades legacy installations, constrains duplicate reports, and matches the forward migration.");
