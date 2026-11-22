import assert from "node:assert/strict";
import fs from "node:fs";

const workflow = fs.readFileSync(".github/workflows/production-schema-preflight.yml", "utf8");

assert.ok(workflow.includes("workflow_dispatch:"), "Production schema preflight must be manually dispatched.");
assert.ok(!/^\s*push:/m.test(workflow), "Production schema preflight must not run automatically on pushes.");
assert.ok(!/^\s*pull_request:/m.test(workflow), "Production schema preflight must not run automatically on pull requests.");
assert.ok(workflow.includes("inputs.confirm_read_only_preflight == 'yes'"), "Preflight must require explicit read-only confirmation.");
assert.ok(workflow.includes("github.event_name == 'workflow_dispatch'"), "Only a manual dispatch may enter the production inspection job.");
assert.ok(workflow.includes("permissions:\n  contents: read"), "Preflight must retain read-only repository permissions.");
assert.ok(workflow.includes("database_name = \"god-emperornovel-db\""), "Preflight must verify the intended production D1 database name.");
assert.ok(workflow.includes("database_id = \"78493557-1142-45e6-96aa-2ba9f67e3be0\""), "Preflight must verify the intended production D1 database ID.");
assert.ok(workflow.includes("READ-ONLY PREFLIGHT COMPLETE"), "Preflight must state its read-only boundary.");
assert.ok(!workflow.includes("wrangler@4 d1 migrations apply"), "Preflight must never apply migrations.");
assert.ok(!workflow.includes("--file=migrations/"), "Preflight must never execute migration files.");

const queryDefinitions = [...workflow.matchAll(/^\s*query "([^"]+)" "(.+)";$/gm)];
assert.ok(queryDefinitions.length >= 20, "Expected a broad set of production schema inspection queries.");
assert.ok(workflow.includes('npx --yes wrangler@4 d1 execute god-emperornovel-db --remote --command "$2"'),
  "The query helper must execute only its explicitly supplied SQL.");
for (const [, label, sql] of queryDefinitions) {
  assert.ok(label.trim().length > 0, "Every production query must have a named evidence label.");
  assert.match(sql, /^\s*(SELECT|PRAGMA)\b/i, "Production inspection statements must be read-only SELECT or PRAGMA statements: " + label);
  assert.doesNotMatch(sql, /\b(?:INSERT|UPDATE|DELETE|REPLACE|ALTER|CREATE|DROP)\b/i,
    "Production preflight must not contain a D1 write or DDL statement: " + label);
}

console.log("Production schema preflight is manual-only, explicitly gated, target-verified, and read-only.");
