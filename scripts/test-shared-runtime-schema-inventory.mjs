import assert from "node:assert/strict";
import fs from "node:fs";

const worker = fs.readFileSync("src/index.js", "utf8");
const runtime = fs.readFileSync("src/runtime-feature-schema.mjs", "utf8");
const inventory = fs.readFileSync("docs/production/SHARED-RUNTIME-SCHEMA-INVENTORY.md", "utf8");
const migration = (name) => fs.readFileSync(`migrations/${name}`, "utf8");

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
console.log("PASS: shared runtime schema coverage and outstanding migration debt are explicitly inventoried.");
