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
assert.ok(coldDb.calls.some(sql => sql.includes("DELETE FROM comment_reports")),
  "legacy duplicate reports must be collapsed before adding the unique index");
assert.ok(coldDb.calls.some(sql => sql.includes("FOREIGN KEY(comment_id) REFERENCES comments(id)")),
  "comment engagement tables must cascade with deleted comments");
assert.ok(coldDb.calls.some(sql => sql.includes("ALTER TABLE comments ADD COLUMN parent_id INTEGER")));
assert.ok(coldDb.calls.some(sql => sql.includes("DELETE FROM auth_rate_limits")));
assert.match(coldDb.calls.at(-1), /runtime_feature_schema_version.*'2'/);

const migration = await readFile(new URL("../migrations/0012_runtime_feature_schema.sql", import.meta.url), "utf8");
for (const table of ["auth_rate_limits", "comment_likes", "comment_reports", "novel_reactions", "request_votes"]) {
  assert.match(migration, new RegExp("CREATE TABLE IF NOT EXISTS " + table));
}
assert.match(migration, /idx_comment_reports_user_comment/);
assert.match(migration, /FOREIGN KEY\(comment_id\) REFERENCES comments\(id\) ON DELETE CASCADE/);

console.log("PASS: runtime feature schema upgrades legacy installations, constrains duplicate reports, and matches the forward migration.");
