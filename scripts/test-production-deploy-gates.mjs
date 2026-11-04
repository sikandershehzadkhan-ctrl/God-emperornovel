import assert from "node:assert/strict";
import fs from "node:fs";

const workflow = fs.readFileSync(".github/workflows/deploy.yml", "utf8");
assert.ok(workflow.includes("workflow_dispatch:"), "Production deploy must remain manual.");
assert.ok(workflow.includes("confirm_production_deploy"), "Production deploy must require an explicit confirmation input.");
assert.ok(workflow.includes("inputs.confirm_production_deploy == 'true'"), "Production job must be gated by the explicit true confirmation.");
assert.ok(!/^\s*push:/m.test(workflow) && !/^\s*pull_request:/m.test(workflow), "Pushes and pull requests must never auto-deploy production.");
assert.ok(workflow.includes("npx --yes wrangler@4 deploy --dry-run"), "Production bundle must be validated before deployment.");
assert.ok(workflow.includes("Verify catalog and author-application D1 migrations after deployment"), "Production deployment must verify additive catalog and creator migrations.");
assert.ok(releasePlan.includes("chapter_revisions") && releasePlan.includes("scheduled_chapter_publications"), "The canonical release plan must account for chapter revision and scheduling structures.");
assert.ok(workflow.includes("Apply and verify additive D1 migrations before Worker deployment"), "The disabled legacy migration step must remain visibly identified.");
assert.ok(workflow.includes("if: ${{ false }}"), "Production deployment and migration execution must remain hard-disabled until the canonical D1 audit is complete.");
assert.ok(!workflow.includes("--file=migrations/"), "No stale branch-local migration file may be applied by the legacy deployment workflow.");
assert.ok(workflow.includes("HARD RELEASE STOP"), "The workflow must explain why production deployment is blocked.");
assert.ok(workflow.indexOf("Validate Cloudflare bundle without deploying") < workflow.indexOf("Apply and verify additive D1 migrations before Worker deployment"), "Source validation must precede any future migration runner.");
assert.ok(workflow.indexOf("Apply and verify additive D1 migrations before Worker deployment") < workflow.indexOf("Deploy Worker and static assets"), "Migration gate must remain before any future Worker deployment.");
const releasePlan = fs.readFileSync("docs/production/CANONICAL-D1-MIGRATION-RELEASE-PLAN.md", "utf8");
assert.ok(releasePlan.includes("STATUS: BLOCKED"), "Production release plan must remain blocked until remote D1 audit.");
assert.ok(releasePlan.includes("0035_ten_point_ratings.sql"), "Release plan must explicitly account for the one-time ratings conversion.");
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
assert.ok(workflow.includes('"$base/api/author/applications/me"') && workflow.includes('!= "401"'), "Creator application API must reject unauthenticated access.");

console.log("Production deploy safety gate tests passed.");
