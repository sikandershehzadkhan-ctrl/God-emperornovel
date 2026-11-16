import assert from "node:assert/strict";
import fs from "node:fs";

const workflow = fs.readFileSync(".github/workflows/audit-production-d1.yml", "utf8");
assert.ok(workflow.includes("workflow_dispatch:"), "The D1 audit must be manually invoked.");
assert.ok(workflow.includes("npx --yes wrangler@4 d1 info god-emperornovel-db"), "The audit must identify the actual D1 backend.");
assert.ok(workflow.includes("npx --yes wrangler@4 d1 time-travel info god-emperornovel-db"), "The audit must capture the available recovery bookmark.");
assert.ok(workflow.includes("sqlite_master"), "The audit must inspect actual remote schema definitions.");
assert.ok(workflow.includes("core_schema_version"), "The audit must inspect the runtime schema marker.");
assert.ok(workflow.includes("foreign_key_check"), "The audit must inspect foreign-key integrity.");
assert.ok(!/d1 execute[^\n]*(?:--file|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE)/i.test(workflow), "The audit must never run a D1 schema or data mutation.");
assert.ok(!/time-travel restore|wrangler@4 deploy\b/i.test(workflow), "The audit must never restore or deploy.");
assert.ok(workflow.includes("No migrations, inserts, updates, deletes, restores, or deployments were run."), "The report must explicitly state its read-only scope.");
console.log("Read-only production D1 audit workflow tests passed.");
