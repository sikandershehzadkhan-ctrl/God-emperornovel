import assert from "node:assert/strict";
import fs from "node:fs";

const worker = fs.readFileSync("src/index.js", "utf8");
const runtime = fs.readFileSync("src/runtime-feature-schema.mjs", "utf8");
const donationIndex = fs.readFileSync("src/donation-reference-index.mjs", "utf8");
const inventory = fs.readFileSync("docs/production/SHARED-RUNTIME-SCHEMA-INVENTORY.md", "utf8");
const migration = (name) => fs.readFileSync(`migrations/${name}`, "utf8");

const apiStart = worker.indexOf("async function api(req,env){");
const apiEnd = worker.indexOf("\n}\n", apiStart);
assert.ok(apiStart >= 0 && apiEnd > apiStart, "API dispatcher boundaries must be located precisely");
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

const routeRead = (start, end) => {
  const from = worker.indexOf(start);
  const to = end ? worker.indexOf(end, from + start.length) : -1;
  assert.ok(from >= 0 && (end ? to > from : true), "GET route source boundary missing: " + start);
  return worker.slice(from, end ? to : from + 1200);
};
for (const [start, end, initializer, route] of [
  ['if(p==="/api/author/ai/projects"&&m==="GET"){', 'if(p==="/api/author/ai/projects"&&m==="POST"){', "ensureAuthorAISchema(env)", "/api/author/ai/projects"],
  ['if(aip&&m==="GET"){', 'if(aip&&m==="PATCH"){', "ensureAuthorAISchema(env)", "/api/author/ai/projects/:id"],
  ['if(/^\\/api\\/author\\/ai\\/projects\\/\\d+\\/jobs$/.test(p)&&m==="GET"){', 'if(p==="/api/author/ai/benchmarks"&&m==="GET"){', "ensureAuthorAISchema(env)", "/api/author/ai/projects/:id/jobs"],
  ['if(p==="/api/author/ai/benchmarks"&&m==="GET"){', 'if(p==="/api/author/ai/benchmarks"&&m==="POST"){', "ensureAuthorAISchema(env)", "/api/author/ai/benchmarks"],
  ['if(p==="/api/admin/publishing"&&m==="GET"){', 'let apn=', "ensurePublishingSchema(env)", "/api/admin/publishing"],
  ['if(ach && m==="GET"){', 'let acm=', "ensurePublishingSchema(env)", "/api/admin/publishing/chapters"],
  ['if(p==="/api/admin/connectors"&&m==="GET"){', 'if(p==="/api/admin/connectors"&&m==="PATCH"){', "seedOmni(env)", "/api/admin/connectors"],
  ['if(p==="/api/admin/connector-authorization-requests"&&m==="GET"){', 'let car=', "ensureOmniTables(env)", "/api/admin/connector-authorization-requests"]
]) {
  const source = routeRead(start, end);
  assert.ok(source.includes(initializer), "route-local GET initializer changed without inventory review: " + route);
  assert.ok(inventory.includes(route), "route-local GET schema side effect is undocumented: " + route);
}

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

assert.ok(worker.includes("await seedTaxonomy(env)"), "core bootstrap taxonomy reference-data writes must remain visible");
assert.ok(worker.includes("await ensureCommunityTaxonomySchema(env)"), "core bootstrap taxonomy-submission DDL must remain visible");
assert.ok(worker.includes("await ensureAgents(env)"), "core bootstrap agent registry seeding must remain visible");
assert.ok(worker.includes("async function runAgent(env,slug,trigger=\"manual\"){await ensureAgents(env)"),
  "agent-run path must remain visible as an additional idempotent registry seed caller");
assert.ok(inventory.includes("Core bootstrap reference-data and registry side effects"),
  "taxonomy and agent reference-data side effects must remain documented");
const initialSchema = migration("0001_initial.sql");
for (const table of ["agents", "agent_runs", "taxonomy_submissions"]) {
  assert.ok(!initialSchema.includes(`CREATE TABLE IF NOT EXISTS ${table}`),
    `0001 must not be treated as canonical owner of runtime-only ${table}`);
}

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

const coreRuntimeDefinitions = [
  "CREATE TABLE IF NOT EXISTS unlock_batches (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,novel_id INTEGER NOT NULL,start_chapter INTEGER NOT NULL,end_chapter INTEGER NOT NULL,requested_count INTEGER NOT NULL,cost REAL NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS bookmarks (user_id INTEGER NOT NULL,novel_id INTEGER NOT NULL,chapter_number INTEGER NOT NULL DEFAULT 1,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,novel_id))",
  "CREATE TABLE IF NOT EXISTS history (user_id INTEGER NOT NULL,novel_id INTEGER NOT NULL,chapter_number INTEGER NOT NULL,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,novel_id))",
  "CREATE TABLE IF NOT EXISTS donations (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,amount REAL NOT NULL,reference_id TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,novel_id INTEGER NOT NULL,body TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'visible',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS novel_requests (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,url TEXT NOT NULL,source_host TEXT NOT NULL,week_key INTEGER NOT NULL,cost REAL NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'pending',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
];
for (const definition of coreRuntimeDefinitions) {
  assert.ok(worker.includes(definition), "core runtime table definition changed without constraint-drift review");
}
for (const [table, constraint] of [
  ["unlock_batches", "FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE"],
  ["bookmarks", "FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE"],
  ["history", "FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE"],
  ["donations", "FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL"],
  ["comments", "FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE"],
  ["novel_requests", "FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE"]
]) {
  const statement = initialMigration.split(";").find((sql) => sql.includes(`CREATE TABLE IF NOT EXISTS ${table} `));
  assert.ok(statement?.includes(constraint), `canonical ${table} foreign-key ownership changed`);
}
assert.ok(inventory.includes("Expanded core-baseline constraint drift"), "expanded core constraint drift must remain documented");

const agentTables = [
  "CREATE TABLE IF NOT EXISTS agents (id INTEGER PRIMARY KEY AUTOINCREMENT,slug TEXT NOT NULL UNIQUE,name TEXT NOT NULL,role TEXT NOT NULL,icon TEXT DEFAULT '🤖',mode TEXT NOT NULL DEFAULT 'automation',status TEXT NOT NULL DEFAULT 'ready',enabled INTEGER NOT NULL DEFAULT 1,last_run_at TEXT,last_result TEXT DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS agent_runs (id INTEGER PRIMARY KEY AUTOINCREMENT,agent_id INTEGER NOT NULL,trigger TEXT NOT NULL,result TEXT DEFAULT '',status TEXT NOT NULL DEFAULT 'ok',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
];
for (const definition of agentTables) assert.ok(worker.includes(definition), "agent runtime schema changed without migration review");
assert.ok(worker.includes("async function ensureAgents(env)"), "agent seed path must remain identifiable");
assert.ok(worker.includes("INSERT OR IGNORE INTO agents(slug,name,role,icon,mode)"), "agent seed must remain reviewable");
assert.ok(worker.includes("CREATE TABLE IF NOT EXISTS taxonomy_submissions"), "taxonomy submission runtime DDL must remain identifiable");
assert.ok(worker.includes("async function seedTaxonomy(env)"), "taxonomy seed path must remain identifiable");
assert.ok(worker.includes("INSERT OR IGNORE INTO genres(name,slug)"), "genre vocabulary seed must remain reviewable");
assert.ok(worker.includes("INSERT OR IGNORE INTO tags(name,slug)"), "tag vocabulary seed must remain reviewable");
const migrationFiles = fs.readdirSync("migrations").filter((name) => name.endsWith(".sql"));
for (const table of ["agents", "agent_runs", "taxonomy_submissions"]) {
  const ownedByMigration = migrationFiles.some((name) => {
    const source = migration(name);
    return new RegExp(`CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?${table}\\b`, "i").test(source);
  });
  assert.equal(ownedByMigration, false, `unexpected migration owner for ${table}; update the runtime ownership inventory`);
}
assert.ok(inventory.includes("Agent registry and taxonomy bootstrap ownership gap"), "agent/taxonomy runtime ownership gap must remain documented");

const migration2 = migration("0002_omniportal.sql");
const migration3 = migration("0003_finish_product.sql");
assert.ok(worker.includes("CREATE TABLE IF NOT EXISTS user_library"), "runtime user library table must remain identifiable");
assert.ok(worker.includes('if(p==="/api/library"&&m==="GET")'), "library GET dependency must remain covered");
assert.ok(worker.includes('if(p==="/api/library"&&m==="POST")'), "library mutation dependency must remain covered");
for (const [file, source] of [["0001_initial.sql", initialMigration], ["0002_omniportal.sql", migration2], ["0003_finish_product.sql", migration3]]) {
  assert.ok(!source.includes("user_library"), `${file} unexpectedly claims canonical user_library ownership; review migration inventory`);
}
assert.ok(inventory.includes("Additional core baseline omissions and publishing default drift"), "user library migration gap and publishing defaults must remain documented");
assert.ok(inventory.includes("`user_library`"), "user library table gap must remain visible");
assert.ok(worker.includes("['publication_status',\"TEXT NOT NULL DEFAULT 'published'\"]"), "runtime publishing default must remain identifiable for drift review");
assert.ok(migration("0004_legal_publishing.sql").includes("publication_status TEXT NOT NULL DEFAULT 'draft'"), "canonical publishing default must remain explicit");
for (const column of ["review_feedback", "reviewed_by", "reviewed_at"]) {
  assert.ok(worker.includes(column), `runtime publishing review column ${column} must remain visible`);
}
const runtimeFeatureSource = runtime;
const integrityMigration = migration("0028_runtime_feature_integrity.sql");
assert.ok(runtimeFeatureSource.includes("CREATE TABLE IF NOT EXISTS comment_reports"), "runtime comment report schema must remain identifiable");
assert.ok(integrityMigration.includes("CREATE TABLE IF NOT EXISTS comment_reports_legacy_duplicates"), "canonical runtime integrity migration must retain duplicate archive");
assert.ok(integrityMigration.includes("trg_comment_reports_validate_insert"), "canonical runtime integrity migration must retain validation triggers");
assert.ok(integrityMigration.includes("idx_comment_reports_user_comment"), "canonical runtime integrity migration must retain uniqueness enforcement");
assert.ok(inventory.includes("Runtime feature table definitions versus migration 0028"), "runtime feature integrity differences must remain documented");