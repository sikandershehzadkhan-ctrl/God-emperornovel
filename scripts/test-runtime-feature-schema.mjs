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

const fastDb = fakeDb({ value: "1" });
await createRuntimeFeatureSchemaEnsurer()({ DB: fastDb });
assert.equal(fastDb.calls.length, 1);
assert.match(fastDb.calls[0], /runtime_feature_schema_version/);

const coldDb = fakeDb(null);
await createRuntimeFeatureSchemaEnsurer()({ DB: coldDb });
for (const table of ["auth_rate_limits", "comment_likes", "comment_reports", "novel_reactions", "request_votes"]) {
  assert.ok(coldDb.calls.some(sql => sql.includes("CREATE TABLE IF NOT EXISTS " + table)));
}
assert.ok(coldDb.calls.some(sql => sql.includes("ALTER TABLE comments ADD COLUMN parent_id INTEGER")));
assert.ok(coldDb.calls.some(sql => sql.includes("DELETE FROM auth_rate_limits")));
assert.match(coldDb.calls.at(-1), /runtime_feature_schema_version/);
console.log("PASS: initialized runtime schema takes one read; first-time bootstrap creates all required feature tables.");
