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

const currentDb = fakeDb({ value: "3" });
await createRuntimeFeatureSchemaEnsurer()({ DB: currentDb });
assert.equal(currentDb.calls.length, 1, "v3 must use the fast path");

for (const marker of ["2", "1", null]) {
  const db = fakeDb(marker === null ? null : { value: marker });
  await createRuntimeFeatureSchemaEnsurer()({ DB: db });
  for (const table of ["auth_rate_limits", "comment_likes", "comment_reports", "novel_reactions", "request_votes", "reading_positions", "community_rate_limit_events", "comment_report_claims"]) {
    assert.ok(db.calls.some(sql => sql.includes("CREATE TABLE IF NOT EXISTS " + table)), "missing table " + table + " for marker " + marker);
  }
  const eventTable = db.calls.find(sql => sql.includes("CREATE TABLE IF NOT EXISTS community_rate_limit_events"));
  const claimTable = db.calls.find(sql => sql.includes("CREATE TABLE IF NOT EXISTS comment_report_claims"));
  assert.ok(eventTable && eventTable.includes("FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE"), "rate-limit events must cascade on user deletion");
  assert.ok(claimTable && claimTable.includes("FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE") && claimTable.includes("FOREIGN KEY(comment_id) REFERENCES comments(id) ON DELETE CASCADE"), "report claims must cascade on user and comment deletion");
  for (const trigger of ["trg_comments_hourly_limit", "trg_comments_prune_rate_limit_events", "trg_comment_reports_prune_rate_limit_events", "trg_comment_reports_hourly_limit_and_claim"]) {
    assert.ok(db.calls.some(sql => sql.includes("CREATE TRIGGER IF NOT EXISTS " + trigger)), "missing trigger " + trigger + " for marker " + marker);
  }
  const prune = db.calls.find(sql => sql.includes("trg_comments_prune_rate_limit_events"));
  assert.ok(prune && prune.includes("DELETE FROM community_rate_limit_events"), "comment cleanup trigger must be executable and non-empty");
  assert.ok(db.calls.some(sql => sql.includes("INSERT OR IGNORE INTO comment_report_claims")), "legacy duplicate reports must be backfilled");
  assert.ok(db.calls.some(sql => sql.includes("runtime_feature_schema_version','3")), "upgrade must finish at schema version 3");
}
console.log("PASS: runtime feature schema fast path and v1/v2-to-v3 upgrades, including atomic community triggers.");
