import assert from "node:assert/strict";
import fs from "node:fs";

const workflow = fs.readFileSync(".github/workflows/deploy.yml", "utf8");
assert.ok(workflow.includes("workflow_dispatch:"), "Production deploy must remain manual.");
assert.ok(workflow.includes("confirm_production_deploy"), "Production deploy must require an explicit confirmation input.");
assert.ok(workflow.includes("inputs.confirm_production_deploy == 'true'"), "Production job must be gated by the explicit true confirmation.");
assert.ok(!/^\s*push:/m.test(workflow) && !/^\s*pull_request:/m.test(workflow), "Pushes and pull requests must never auto-deploy production.");
assert.ok(workflow.includes("npx --yes wrangler@4 deploy --dry-run"), "Production bundle must be validated before deployment.");
assert.ok(workflow.includes("Verify catalog and author-application D1 migrations after deployment"), "Production deployment must verify additive catalog and creator migrations.");
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
