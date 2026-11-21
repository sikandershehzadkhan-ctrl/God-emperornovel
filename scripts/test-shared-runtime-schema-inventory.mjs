import assert from "node:assert/strict";
import fs from "node:fs";

const worker = fs.readFileSync("src/index.js", "utf8");
const runtime = fs.readFileSync("src/runtime-feature-schema.mjs", "utf8");
const donationIndex = fs.readFileSync("src/donation-reference-index.mjs", "utf8");
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
assert.ok(donationIndex.includes("CREATE UNIQUE INDEX IF NOT EXISTS idx_donations_reference_normalized"),
  "donation reference index runtime DDL must remain visible until migration ownership is confirmed");
assert.ok(worker.includes("await ensureDonationReferenceIndex(env)"),
  "donation submission runtime index call site must remain visible until migration cutover");
assert.ok(inventory.includes("`POST /api/donations`"),
  "donation reference index DDL call site is not inventoried");

console.log("PASS: shared runtime schema coverage and outstanding migration debt are explicitly inventoried.");

assert.ok(!worker.includes("God-Emperor's Infinite Ascension"),
  "production bootstrap must not seed a deployment-demo novel");
assert.ok(!worker.includes("placeholder chapter content for deployment testing"),
  "production bootstrap must not seed placeholder chapter bodies");

const omniStart = worker.indexOf("async function ensureOmniTables(env)");
const omniEnd = worker.indexOf("async function seedOmni(env)", omniStart);
assert.ok(omniStart >= 0 && omniEnd > omniStart, "OmniPortal runtime schema helper must remain identifiable");
const omniSchema = worker.slice(omniStart, omniEnd);
assert.ok((omniSchema.match(/catch\{\}/g) || []).length >= 1,
  "inventory must be reviewed if broad connector ALTER error suppression changes");
assert.ok(omniSchema.includes(".catch(()=>{})"),
  "inventory must be reviewed if OmniPortal schema batch error suppression changes");
const seedStart = omniEnd;
const seedEnd = worker.indexOf("async function seedTaxonomy", seedStart);
const omniSeed = worker.slice(seedStart, seedEnd);
assert.ok(omniSeed.includes("catch(e){console.error('connector seed',e)}"),
  "connector registry seed failure handling changed; review explicit seed cutover");
assert.ok(inventory.includes("broad exception suppression") && inventory.includes("schema-readiness evidence"),
  "OmniPortal schema error suppression must be explicitly documented");

const aiGetRoutes = [
  'if(p==="/api/author/ai/projects"&&m==="GET"){',
  'if(aip&&m==="GET"){',
  'jobs$/.test(p)&&m==="GET"){' ,
  'if(p==="/api/author/ai/benchmarks"&&m==="GET"){',
];
for (const route of aiGetRoutes) {
  const at = worker.indexOf(route);
  assert.ok(at >= 0, `Author Studio GET route must remain identifiable: ${route}`);
  const nextRoute = worker.indexOf("\n if(", at + route.length);
  const handler = worker.slice(at, nextRoute > at ? nextRoute : at + 1800);
  assert.ok(handler.includes("ensureAuthorAISchema(env)"),
    `Author Studio GET schema side effect changed and requires cutover review: ${route}`);
}
assert.ok(inventory.includes("Additional Author Studio GET schema side effects"),
  "direct Author Studio GET DDL call sites must be inventoried separately from shared bootstrap");
for (const route of [
  'if(p==="/api/admin/publishing"&&m==="GET"){',
  'if(ach && m==="GET"){',
]) {
  const at = worker.indexOf(route);
  assert.ok(at >= 0, `publishing GET route must remain identifiable: ${route}`);
  const nextRoute = worker.indexOf("\n if(", at + route.length);
  const handler = worker.slice(at, nextRoute > at ? nextRoute : at + 1800);
  assert.ok(handler.includes("ensurePublishingSchema(env)"),
    `publishing GET schema side effect changed and requires cutover review: ${route}`);
}
assert.ok(inventory.includes("Additional publishing GET schema side effects"),
  "direct publishing GET DDL and backfill call sites must be inventoried");
const runtimeFeature = runtime;
assert.ok(runtimeFeature.includes("CREATE TABLE IF NOT EXISTS auth_rate_limits"), "runtime feature schema inventory must retain auth rate-limit table evidence");
assert.ok(runtimeFeature.includes("DELETE FROM auth_rate_limits WHERE window_start<?"), "runtime feature schema cleanup side effect must remain visible for cutover review");
assert.ok(runtimeFeature.includes("runtime_feature_schema_version"), "runtime feature schema marker must remain visible for cutover review");
assert.ok(inventory.includes("Runtime feature schema bootstrap and request-time cleanup"), "shared runtime feature schema bootstrap must be inventoried");
const initialMigration = migration("0001_initial.sql");
assert.ok(initialMigration.includes("CHECK(role IN ('user','author','moderator','admin'))"), "canonical initial migration must retain the users role constraint");
assert.ok(initialMigration.includes("FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE"), "canonical initial migration must retain user foreign-key constraints");
assert.ok(worker.includes("CREATE TABLE IF NOT EXISTS users"), "runtime core bootstrap must remain identifiable for schema drift review");
assert.ok(inventory.includes("Canonical migration versus core runtime bootstrap schema drift"), "migration/runtime schema divergence must remain documented");