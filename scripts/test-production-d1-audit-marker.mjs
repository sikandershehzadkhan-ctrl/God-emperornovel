import assert from "node:assert/strict";
import fs from "node:fs";

const workflow = fs.readFileSync(".github/workflows/audit-production-d1.yml", "utf8");
const markerStart = workflow.indexOf('if marker_table_check=');
const markerEnd = workflow.indexOf('run_query "Release 17.22 schema readiness', markerStart);
assert.notEqual(markerStart, -1, "Production audit must inspect the app_settings marker table.");
assert.notEqual(markerEnd, -1, "Production audit marker inspection block must be complete.");
const markerBlock = workflow.slice(markerStart, markerEnd);

assert.ok(markerBlock.includes('then'), "Marker inspection must branch on the actual command exit status.");
assert.ok(!markerBlock.includes("|| true"), "Marker inspection must not suppress Wrangler/query failures.");
assert.ok(markerBlock.includes("audit_query_failures=$((audit_query_failures + 1))"), "Unsuccessful marker inspection must fail the overall audit.");
assert.ok(markerBlock.includes("Could not inspect app_settings marker state"), "Command failures must be reported as unverified, not as table absence.");
assert.ok(markerBlock.includes("THEN 'present' ELSE 'absent'"), "A successful query must distinguish observed present and absent states.");
assert.ok(markerBlock.includes("Observed: app_settings table is absent"), "Only a successful absent result may be reported as observed absence.");
assert.ok(markerBlock.includes("unrecognized present/absent result"), "Unexpected successful output must fail closed.");

console.log("Production D1 marker audit fail-closed tests passed.");
