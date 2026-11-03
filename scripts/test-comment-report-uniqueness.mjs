import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const worker = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const runtime = readFileSync(new URL("../src/runtime-feature-schema.mjs", import.meta.url), "utf8");
const migration = readFileSync(new URL("../migrations/0019_comment_report_uniqueness.sql", import.meta.url), "utf8");

const start = worker.indexOf('if(p==="/api/comments/report"&&m==="POST"){');
const end = worker.indexOf('if(p==="/api/rating"', start);
assert.ok(start >= 0 && end > start, "comment report endpoint must exist");
const route = worker.slice(start, end);
assert.match(route, /INSERT OR IGNORE INTO comment_reports/, "comment report insert remains idempotent");
assert.match(route, /WHERE user_id=\? AND comment_id=\? LIMIT 1/, "duplicate report response checks the account/comment pair");
assert.match(route, /COUNT\(\*\) FROM comment_reports WHERE user_id=\? AND created_at>=datetime\('now','-1 hour'\)/, "hourly per-account report limit remains enforced");

assert.match(runtime, /marker\?\.value === "2"/, "runtime schema version must advance for existing installations");
assert.match(runtime, /DELETE FROM comment_reports WHERE id NOT IN \(SELECT MIN\(id\) FROM comment_reports GROUP BY user_id,comment_id\)/, "runtime upgrade must deduplicate legacy rows before indexing");
assert.match(runtime, /CREATE UNIQUE INDEX IF NOT EXISTS idx_comment_reports_user_comment ON comment_reports\(user_id,comment_id\)/, "runtime upgrade must enforce unique account/comment reports");
assert.match(runtime, /runtime_feature_schema_version','2'/, "runtime schema upgrade must persist version 2");

assert.match(migration, /CREATE TABLE IF NOT EXISTS comment_reports/, "fresh D1 installs must create the table before indexing");\nassert.match(migration, /GROUP BY user_id, comment_id/, "ordered migration deduplicates existing rows");
assert.match(migration, /CREATE UNIQUE INDEX IF NOT EXISTS idx_comment_reports_user_comment/, "ordered migration adds the unique index");

console.log("PASS: comment report policy and fresh-install/runtime-upgrade uniqueness constraints are present.");
