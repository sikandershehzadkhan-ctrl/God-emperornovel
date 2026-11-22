import assert from "node:assert/strict";
import fs from "node:fs";

const workflow = fs.readFileSync(".github/workflows/deploy.yml", "utf8");
const schemaInventory = fs.readFileSync("docs/production/SHARED-RUNTIME-SCHEMA-INVENTORY.md", "utf8");
assert.ok(workflow.includes("workflow_dispatch:"), "Production deploy must remain manual.");
assert.ok(workflow.includes("Block production deployment while canonical migrations are pending"),
  "Production deploy must hard-block while later canonical migrations are not wired into the release sequence.");
assert.ok(workflow.includes("10#$number > 11"),
  "The release block must detect every four-digit migration number after 0011.");
assert.ok(workflow.includes("canonical migrations after 0011 are not yet wired"),
  "The release block must explain the exact unresolved migration boundary.");
assert.ok(workflow.indexOf("Block production deployment while canonical migrations are pending") < workflow.indexOf("Validate source and production configuration"),
  "The pending-migration guard must run before build, D1 writes, or deployment.");
assert.ok(workflow.includes("confirm_production_deploy"), "Production deploy must require an explicit confirmation input.");
assert.ok(workflow.includes("inputs.confirm_production_deploy == 'true'"), "Production job must be gated by the explicit true confirmation.");
assert.ok(!/^\s*push:/m.test(workflow) && !/^\s*pull_request:/m.test(workflow), "Pushes and pull requests must never auto-deploy production.");
assert.ok(workflow.includes("npx --yes wrangler@4 deploy --dry-run"), "Production bundle must be validated before deployment.");
assert.ok(workflow.includes("Verify catalog and author-application D1 migrations after deployment"), "Production deployment must verify additive catalog and creator migrations.");
assert.ok(workflow.includes("Apply and verify additive D1 migrations before Worker deployment"), "Production D1 migrations must run before publishing the Worker.");
for (const migration of ["0012_user_profiles.sql", "0028_runtime_feature_integrity.sql", "0046_atomic_ai_run_claims.sql", "0048_omniportal_runtime_support.sql", "0049_unique_pending_connector_authorization.sql"]) {
  assert.ok(!workflow.includes("--file=migrations/" + migration), "Production deploy must not silently apply an unreconciled canonical migration: " + migration);
}
assert.ok(schemaInventory.includes("those later migrations are not included in the deploy workflow's apply step"),
  "The release documentation must explicitly disclose that canonical migrations 0012+ are not yet wired into production deployment.");
for (const migration of ["migrations/0009_catalog_filter_indexes.sql", "migrations/0010_catalog_sort_indexes.sql", "migrations/0011_author_applications.sql"]) {
  assert.ok(workflow.includes("--file=" + migration), "Pre-deploy migration step must apply " + migration);
}
assert.ok(workflow.indexOf("Validate Cloudflare bundle without deploying") < workflow.indexOf("Apply and verify additive D1 migrations before Worker deployment"), "Validate the Worker bundle before mutating production D1.");
assert.ok(workflow.indexOf("Apply and verify additive D1 migrations before Worker deployment") < workflow.indexOf("Deploy Worker and static assets"), "D1 schema must be ready before the Worker is deployed.");
assert.ok(workflow.includes("author_applications exists with an incomplete or unrecognized schema"), "Partial author application schemas must fail closed.");

for (const index of [
  "idx_novel_genres_genre_novel",
  "idx_novel_tags_tag_novel",
  "idx_unlocks_chapter_time",
  "idx_novels_published_views",
  "idx_novels_published_rating",
  "idx_novels_published_created",
  "idx_author_applications_one_pending",
]) assert.ok(workflow.includes(index), "Post-deploy D1 verification must include " + index);
assert.ok(workflow.includes('"$base/discover?verify=$stamp"'), "Post-deploy checks must exercise the direct Discover route.");
assert.ok(workflow.includes('"$base/author?verify=$stamp"'), "Post-deploy checks must exercise Author Studio.");
assert.ok(workflow.includes('"$base/admin?verify=$stamp"'), "Post-deploy checks must exercise the admin shell.");
assert.ok(workflow.includes('"$base/api/author/applications/me?verify=$stamp-$attempt"') && workflow.includes("for attempt in 1 2 3 4 5"), "Creator application API verification must retry transient edge failures before failing the release.");
assert.ok(workflow.includes('echo "Unauthenticated author-application guard check: HTTP $auth_status (attempt $attempt/5)."') && workflow.includes('!= "401"'), "Creator application API must still fail closed unless the unauthenticated response is exactly HTTP 401.");

console.log("Production deploy safety gate tests passed.");
