import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(new URL("../migrations/0020_report_lifecycle_indexes.sql", import.meta.url), "utf8");
const core = readFileSync(new URL("../migrations/0001_initial.sql", import.meta.url), "utf8");
const reports = readFileSync(new URL("../migrations/0003_finish_product.sql", import.meta.url), "utf8");
const commentReports = readFileSync(new URL("../migrations/0019_comment_report_uniqueness.sql", import.meta.url), "utf8");
for (const name of [
  "idx_reports_status_created",
  "idx_reports_user_created",
  "idx_reports_novel",
  "idx_reports_chapter",
  "idx_comment_reports_status_created",
  "idx_comment_reports_comment_status"
]) assert.ok(migration.includes(name), "missing report lifecycle index: " + name);
assert.ok(core.includes("CREATE TABLE IF NOT EXISTS comments"), "base comments table must exist");
assert.ok(reports.includes("CREATE TABLE IF NOT EXISTS reports"), "generic reports table must exist before index migration");
assert.ok(commentReports.includes("CREATE TABLE IF NOT EXISTS comment_reports"), "comment reports must exist before index migration");
assert.ok(!migration.includes("DELETE FROM"), "index migration must not delete report evidence");
assert.ok(!migration.includes("DROP TABLE"), "index migration must not rebuild or erase report tables");
console.log("Report lifecycle migration policy checks passed.");
