import assert from "node:assert/strict";
import fs from "node:fs";

const workflow = fs.readFileSync(".github/workflows/deploy.yml", "utf8");
assert.ok(workflow.includes("workflow_dispatch:"), "Production workflow must remain manually invoked.");
assert.ok(workflow.includes("deploy:"), "Production deploy job must remain explicit.");
assert.ok(/deploy:\s*\n\s*# HARD GATE:[^\n]*\n\s*if:\s*\$\{\{\s*false\s*\}\}/.test(workflow), "Production deploy job must be hard-disabled until canonical migration reconciliation.");
assert.ok(workflow.includes("branch-local migrations 0012/0013 are not canonical"), "The release gate must explain the migration collision.");
assert.ok(!/^\s*push:/m.test(workflow) && !/^\s*pull_request:/m.test(workflow), "Pushes and pull requests must never auto-deploy production.");
assert.ok(workflow.includes("migrations/0012_ten_point_ratings.sql"), "The stale branch-local rating migration must remain visible for review, not silently disappear.");
assert.ok(workflow.includes("migrations/0013_reader_progress.sql"), "The stale branch-local reader migration must remain visible for review, not silently disappear.");

console.log("Production deploy hard-disable gate tests passed.");
