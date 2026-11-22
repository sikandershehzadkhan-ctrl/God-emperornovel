import assert from "node:assert/strict";
import fs from "node:fs";

const workflow = fs.readFileSync(".github/workflows/audit-production-d1.yml", "utf8");

assert.match(workflow, /workflow_dispatch:/, "Production audit must remain manually dispatched.");
assert.match(workflow, /confirm_read_only_audit:/, "Production audit must require an explicit confirmation input.");
assert.match(workflow, /if: \$\{\{ inputs\.confirm_read_only_audit == 'yes' \}\}/,
  "Production audit job must not run unless the operator selects yes.");
assert.match(workflow, /permissions:\s*\n\s+contents: read/,
  "Audit workflow must use read-only repository permissions.");
assert.match(workflow, /--remote --command/, "Audit must query the configured remote D1 database.");
assert.match(workflow, /audit_query_failures=\$\(\(audit_query_failures \+ 1\)\)/,
  "Failed schema inspections must increment the fail-closed counter.");
assert.match(workflow, /if \[ "\$audit_query_failures" -ne 0 \]/,
  "Any failed required inspection must fail the audit.");
assert.match(workflow, /PRAGMA foreign_key_check/,
  "Audit must inspect foreign-key integrity.");
assert.match(workflow, /sqlite_master WHERE name NOT LIKE 'sqlite_%' AND sql IS NOT NULL/,
  "Audit must capture complete schema-object definitions.");

const requiredEvidence = [
  "review_feedback", "reviewed_by", "reviewed_at",
  "parent_id", "edited_at",
  "search_url", "auth_header", "secret_name", "rights_evidence_url",
  "terms_url", "rights_notes", "metadata_import_allowed", "attribution_required",
  "agents", "agent_runs", "taxonomy_submissions",
  "connector_authorization_requests", "idx_connector_auth_one_pending_per_connector",
  "d1_migrations", "core_schema_version", "first_admin_bootstrap_done"
];
for (const item of requiredEvidence) {
  assert.ok(workflow.includes(item), `Production audit is missing required evidence: ${item}`);
}

const queryLabels = [...workflow.matchAll(/^\s*run_query "([^"]+)"/gm)].map(match => match[1]);
assert.ok(queryLabels.length >= 20, "Audit must retain its expected set of read-only SQL inspections.");
assert.ok(queryLabels.includes("Critical runtime column compatibility (read-only)"));
assert.ok(queryLabels.includes("Complete production schema object definitions"));
assert.ok(queryLabels.includes("Production foreign-key integrity check"));
assert.doesNotMatch(workflow, /d1\s+migrations\s+apply|wrangler[^\n]*deploy/i,
  "Read-only audit must never apply migrations or deploy the Worker.");

const inventoryStepStart = workflow.indexOf("- name: Read-only database inventory");
assert.ok(inventoryStepStart >= 0, "The required read-only inventory step must exist.");
const inventoryStep = workflow.slice(inventoryStepStart);
assert.doesNotMatch(inventoryStep, /^\\s+continue-on-error:/m,
  "Required database inventory failures must never be downgraded to successful workflow steps.");
assert.match(inventoryStep, /if ! npx --yes wrangler@4 d1 execute god-emperornovel-db --remote --command/,
  "Each required query must explicitly detect command failure.");
assert.ok(inventoryStep.includes("Read-only audit finished with $audit_query_failures failed required database inspection"),
  "The inventory must fail closed when any required query fails.");
assert.ok(inventoryStep.includes("audit_query_failures=$((audit_query_failures + 1))"),
  "Failed migration-marker probes must also fail the audit.");

console.log("PASS: production D1 audit is manually gated, read-only, fail-closed, and covers runtime schema cutover evidence.");
