import assert from "node:assert/strict";
import fs from "node:fs";

const worker = fs.readFileSync("src/index.js", "utf8");
const runtime = fs.readFileSync("src/runtime-feature-schema.mjs", "utf8");
const inventory = fs.readFileSync("docs/production/SHARED-RUNTIME-SCHEMA-INVENTORY.md", "utf8");
const migration = (name) => fs.readFileSync(`migrations/${name}`, "utf8");

const apiStart = worker.indexOf("async function api(req,env){");
const apiEnd = worker.indexOf('if(p===" /api/agents"', apiStart);
assert.ok(apiStart >= 0, "API dispatcher must exist");
const apiSource = worker.slice(apiStart, apiEnd > apiStart ? apiEnd : worker.length);
const healthFastPath = apiSource.indexOf('if(p==="/api/health"&&m==="GET")');
const coreBootstrap = apiSource.indexOf("await ensureCoreSchema(env)");
const featureBootstrap = apiSource.indexOf("await ensureRuntimeFeatureSchema(env)");
assert.ok(healthFastPath >= 0 && coreBootstrap > healthFastPath && featureBootstrap > coreBootstrap,
  "API schema bootstrap must remain explicitly located after the health fast path until migration cutover");
const scheduledStart = worker.indexOf("async scheduled(event,env)");
const scheduledEnd = worker.indexOf(",async fetch(req,env)", scheduledStart);
assert.ok(scheduledStart >= 0 && scheduledEnd > scheduledStart,
  "scheduled Worker handler must remain identifiable");
assert.match(worker.slice(scheduledStart, scheduledEnd), /ensureCoreSchema\(env\)/,
  "scheduled handler schema bootstrap must remain documented until readiness-check cutover");

for (const marker of [
  "ensureCoreSchema(env)",
  "ensureRuntimeFeatureSchema(env)",
  "ensurePublishingSchema(env)",
  "ensureAuthorAISchema(env)",
  "ensureCommunityTaxonomySchema(env)",
  "ensureOmniTables(env)"
]) assert.ok(worker.includes(marker), `runtime schema entrypoint missing: ${marker}`);

for (const column of ["parent_id INTEGER", "edited_at TEXT"]) {
  assert.ok(runtime.includes(column), `runtime comments schema changed without inventory review: ${column}`);
  assert.ok(inventory.includes(column), `outstanding runtime schema debt is undocumented: ${column}`);
}

for (const column of [
  "search_url", "auth_header", "secret_name", "rights_evidence_url",
  "terms_url", "rights_notes", "metadata_import_allowed", "attribution_required"
]) {
  assert.ok(worker.includes(`ADD COLUMN ${column}`), `connector runtime schema changed: ${column}`);
  assert.ok(inventory.includes(`connectors.${column}`), `connector schema debt is undocumented: ${column}`);
}

for (const column of ["review_feedback", "reviewed_by", "reviewed_at"]) {
  assert.ok(worker.includes(`'${column}'`) || worker.includes(`"${column}"`), `novel review runtime column changed: ${column}`);
  assert.ok(inventory.includes(`novels.${column}`), `novel review schema debt is undocumented: ${column}`);
}

for (const table of ["agents", "agent_runs"]) {
  assert.ok(worker.includes(`CREATE TABLE IF NOT EXISTS ${table}`), `runtime agent schema changed: ${table}`);
  assert.ok(inventory.includes(`\`${table}\``), `agent schema debt is undocumented: ${table}`);
}
assert.ok(worker.includes("idx_agent_runs_agent"));
assert.ok(inventory.includes("idx_agent_runs_agent"));

assert.ok(worker.includes("CREATE TABLE IF NOT EXISTS taxonomy_submissions"));
assert.ok(inventory.includes("taxonomy_submissions"), "taxonomy schema debt must remain visible");

for (const [file, needles] of [
  ["0004_legal_publishing.sql", ["owner_user_id", "publication_status", "rights_evidence"]],
  ["0005_chapter_publishing.sql", ["chapter_views", "idx_chapters_publication"]],
  ["0007_ai_author_studio.sql", ["ai_author_projects", "ai_chapter_jobs", "ai_generation_runs"]],
  ["0028_runtime_feature_integrity.sql", ["auth_rate_limits", "comment_likes", "comment_reports", "novel_reactions", "request_votes"]],
  ["0048_omniportal_runtime_support.sql", ["connector_events", "import_jobs", "recommendations", "connector_authorization_requests"]]
]) {
  const source = migration(file);
  for (const needle of needles) assert.ok(source.includes(needle), `${file} missing expected schema coverage: ${needle}`);
}

assert.match(inventory, /PRODUCTION STATE UNKNOWN/);
assert.match(inventory, /Do not remove either shared initializer/);

for (const route of [
  "`GET /api/admin/connectors`",
  "`GET /api/admin/connector-authorization-requests`",
  "`PATCH /api/admin/connectors`",
  "`POST /api/omni/import`",
  "`POST /api/admin/omni/health`",
  "`POST /api/admin/connectors/cleanup`",
  "`POST /api/connector-authorization-requests`",
  "`PATCH /api/admin/connector-authorization-requests/:id`"
]) assert.ok(inventory.includes(route), `route-level runtime DDL call site is not inventoried: ${route}`);

assert.ok(worker.includes('if(p==="/api/admin/connectors"&&m==="GET"){const e=admin(u);if(e)return e;await seedOmni(env);'),
  "admin connector GET must remain visible as a schema-and-seed side-effect until cutover");
assert.ok(worker.includes('if(p==="/api/admin/connector-authorization-requests"&&m==="GET"){const e=admin(u);if(e)return e;await ensureOmniTables(env);'),
  "admin authorization-request GET must remain visible as a direct DDL side-effect until cutover");

console.log("PASS: shared runtime schema coverage and outstanding migration debt are explicitly inventoried.");
