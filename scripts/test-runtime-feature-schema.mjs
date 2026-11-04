import assert from "node:assert/strict";
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
assert.equal(fastDb.calls.length, 1);
assert.match(fastDb.calls[0], /runtime_feature_schema_version/);

const legacyDb = fakeDb({ value: "1" });
await createRuntimeFeatureSchemaEnsurer()({ DB: legacyDb });
assert.ok(legacyDb.calls.some(sql => sql.includes("CREATE TABLE IF NOT EXISTS community_rate_limit_events")), "version 1 must upgrade to version 2");

const coldDb = fakeDb(null);
await createRuntimeFeatureSchemaEnsurer()({ DB: coldDb });
for (const table of ["auth_rate_limits", "comment_likes", "comment_reports", "novel_reactions", "request_votes", "community_rate_limit_events", "comment_report_claims"]) {
  assert.ok(coldDb.calls.some(sql => sql.includes("CREATE TABLE IF NOT EXISTS " + table)));
}
assert.ok(coldDb.calls.some(sql => sql.includes("ALTER TABLE comments ADD COLUMN parent_id INTEGER")));
assert.ok(coldDb.calls.some(sql => sql.includes("DELETE FROM auth_rate_limits")));
assert.ok(coldDb.calls.some(sql => sql.includes("INSERT OR IGNORE INTO comment_report_claims")));
assert.ok(coldDb.calls.some(sql => sql.includes("CREATE TRIGGER IF NOT EXISTS trg_comments_hourly_limit")));
assert.ok(coldDb.calls.some(sql => sql.includes("CREATE TRIGGER IF NOT EXISTS trg_comment_reports_hourly_limit_and_claim")));
assert.match(coldDb.calls.at(-1), /runtime_feature_schema_version/);
console.log("PASS: initialized runtime schema takes one read; first-time bootstrap creates all required feature tables.");
