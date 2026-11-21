import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const path = 'docs/production/production-d1-read-only-audit.sql';
const source = readFileSync(path, 'utf8');
const workflow = readFileSync('.github/workflows/audit-production-d1.yml', 'utf8');

// Strip SQL comments before checking each executable statement.
const withoutComments = source
  .replace(/--[^\n]*/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '');
const statements = withoutComments
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean);

assert.ok(statements.length >= 4, 'Expected the complete read-only audit query set.');
for (const [index, statement] of statements.entries()) {
  assert.match(
    statement,
    /^SELECT\b/i,
    `Audit statement ${index + 1} must be a SELECT query only.`
  );
  assert.doesNotMatch(
    statement,
    /\b(?:INSERT|UPDATE|DELETE|REPLACE|CREATE|ALTER|DROP|ATTACH|DETACH|VACUUM|REINDEX|BEGIN|COMMIT|ROLLBACK)\b/i,
    `Audit statement ${index + 1} contains a forbidden mutation/control keyword.`
  );
}


assert.match(workflow, /workflow_dispatch:/, 'the production audit must be manually triggered');
assert.match(workflow, /default: "no"/, 'manual audit confirmation must default to no');
assert.ok(workflow.includes("if: ${{ inputs.confirm_read_only_audit == 'yes' }}"), 'the job must require explicit yes confirmation');
assert.doesNotMatch(workflow, /^  push:/m, 'production audit must never run automatically on push');
assert.doesNotMatch(workflow, /^  pull_request:/m, 'production audit must never run on pull requests');
assert.match(workflow, /wrangler@4 d1 execute god-emperornovel-db --remote/, 'audit queries must explicitly target the configured remote D1 database');
assert.doesNotMatch(workflow, /wrangler@4 d1 migrations apply|wrangler@4 deploy/, 'audit workflow must never apply migrations or deploy the Worker');
for (const [table, column] of [
  ['novels', 'review_feedback'], ['novels', 'reviewed_by'], ['novels', 'reviewed_at'],
  ['comments', 'parent_id'], ['comments', 'edited_at'],
  ['connectors', 'search_url'], ['connectors', 'auth_header'], ['connectors', 'secret_name'],
  ['connectors', 'rights_evidence_url'], ['connectors', 'terms_url'], ['connectors', 'rights_notes'],
  ['connectors', 'metadata_import_allowed'], ['connectors', 'attribution_required']
]) {
  assert.ok(workflow.includes(`('${table}','${column}')`), `production audit must inspect ${table}.${column}`);
}
assert.ok(workflow.includes('PRAGMA table_info(agent_runs);'), 'audit must inspect agent run history columns');
assert.ok(workflow.includes('PRAGMA table_info(taxonomy_submissions);'), 'audit must inspect taxonomy proposal columns');
assert.ok(workflow.includes('Complete production schema object definitions'), 'audit must capture actual table, index, trigger and view definitions');
assert.ok(workflow.includes('PRAGMA foreign_key_check;'), 'audit must inspect production foreign-key integrity');
assert.ok(workflow.includes("('agent_runs','agent_id')"), 'audit must inspect agent-run ownership/link columns');
assert.ok(workflow.includes("('taxonomy_submissions','creator_id')"), 'audit must inspect taxonomy submitter identity columns');
assert.ok(workflow.includes("('connector_authorization_requests','reviewed_by')"), 'audit must inspect connector review attribution');
assert.ok(workflow.includes('Migration 0049 unique-index presence'), 'audit must verify the pending-request uniqueness index after migration');

assert.ok(workflow.includes('Duplicate pending connector authorization requests (must be zero before migration 0049)'), 'audit must preflight duplicate pending connector requests before migration 0049');


console.log(`PASS: ${statements.length} production D1 audit statements are SELECT-only.`);
