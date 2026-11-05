import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const schema = readFileSync(new URL("../src/runtime-feature-schema.mjs", import.meta.url), "utf8");
const worker = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
assert.match(schema, /runtime_feature_schema_version','3/);
assert.match(schema, /CREATE TABLE IF NOT EXISTS community_rate_limit_events/);
assert.match(schema, /CREATE TABLE IF NOT EXISTS comment_report_claims/);
assert.match(schema, /idx_community_rate_limit_created/);
assert.match(schema, /FOREIGN KEY\(user_id\) REFERENCES users\\(id\\) ON DELETE CASCADE/);
assert.match(schema, /FOREIGN KEY\(comment_id\) REFERENCES comments\\(id\\) ON DELETE CASCADE/);
assert.match(schema, /INSERT OR IGNORE INTO comment_report_claims\(user_id,comment_id\) SELECT DISTINCT/);
for (const trigger of [
  "trg_comments_hourly_limit",
  "trg_comments_prune_rate_limit_events",
  "trg_comment_reports_prune_rate_limit_events",
  "trg_comment_reports_hourly_limit_and_claim"
]) assert.ok(schema.includes("CREATE TRIGGER IF NOT EXISTS " + trigger), "missing trigger " + trigger);

const commentPrune = schema.match(/trg_comments_prune_rate_limit_events[\s\S]*?BEGIN([\s\S]*?)END/);
assert.ok(commentPrune && commentPrune[1].includes("DELETE FROM community_rate_limit_events"), "comment cleanup trigger must have a real pruning statement");
assert.ok(!/trg_comments_prune_rate_limit_events[\s\S]*?BEGIN\s*END/.test(schema), "empty SQLite triggers are forbidden");
assert.match(schema, /RAISE\(ABORT,'comment_hourly_limit'\)/);
assert.match(schema, /RAISE\(ABORT,'comment_report_hourly_limit'\)/);

const comment = worker.split("\n").find(line => line.includes('if(p==="/api/comments"&&m==="POST")'));
const report = worker.split("\n").find(line => line.includes('if(p==="/api/comments/report"&&m==="POST")'));
assert.ok(comment && !comment.includes("SELECT COUNT(*)") && comment.includes("comment_hourly_limit"), "comment quota must be enforced by the atomic database trigger");
assert.ok(report && !report.includes("SELECT COUNT(*)") && report.includes("comment_report_hourly_limit"), "report quota must be enforced by the atomic database trigger");
assert.ok(report.includes("comment_report_claims.user_id"), "duplicate reports must be serialized by a unique claim");
console.log("PASS: v3 runtime schema, non-empty cleanup triggers, and database-enforced atomic quotas.");
