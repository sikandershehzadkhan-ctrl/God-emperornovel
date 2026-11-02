import assert from "node:assert/strict";
import fs from "node:fs";

const worker=fs.readFileSync("src/index.js","utf8");
const app=fs.readFileSync("public/app.js","utf8");
const shipped=fs.readFileSync("public/app-17.24.0.js","utf8");
const css=fs.readFileSync("public/app-17.24.0.css","utf8");
const migration=fs.readFileSync("migrations/0014_author_story_goals.sql","utf8");

const routeAt=worker.indexOf('if(p==="/api/author/goals"&&m==="GET")');
assert.ok(routeAt>=0,"Writing goals GET route must exist.");
const route=worker.slice(routeAt,worker.indexOf('if(p==="/api/author/planning"',routeAt));
assert.ok(route.includes("const e=author(u)"),"Goal endpoints must require an author/admin session.");
assert.ok(route.includes("WHERE g.owner_user_id=? AND n.owner_user_id=?"),"Goal reads must be scoped to the authenticated story owner.");
assert.ok(route.includes("WHERE id=? AND owner_user_id=?"),"Goal writes must verify ownership before mutation.");
assert.ok(route.includes("targetChapters>10000")&&route.includes("targetWords>5000000"),"Goal targets must have bounded integer validation.");
assert.ok(route.includes("Number.isInteger(targetChapters)")&&route.includes("Number.isInteger(targetWords)"),"Fractional targets must be rejected.");
assert.ok(route.includes("YYYY-MM-DD")&&route.includes("valid calendar date"),"Target dates must be validated.");
assert.ok(route.includes("WHERE author_story_goals.owner_user_id=excluded.owner_user_id"),"Upsert must not overwrite another owner's goal.");
assert.ok(route.includes("author_story_goal_saved")&&route.includes("author_story_goal_cleared"),"Goal changes must be audit logged.");

assert.ok(migration.includes("PRIMARY KEY")&&migration.includes("FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE"),"Goal records must be story-bound and cascade on story deletion.");
assert.ok(migration.includes("CHECK(target_chapters BETWEEN 0 AND 10000)")&&migration.includes("CHECK(target_words BETWEEN 0 AND 5000000)"),"D1 must enforce goal bounds.");
assert.ok(migration.includes("idx_author_story_goals_owner_updated"),"Owner lookup index must exist.");

assert.ok(app.includes("authorGoalsPanel")&&shipped.includes("authorGoalsPanel"),"Author Studio must render the writing goals workspace.");
assert.ok(app.includes("api('/api/author/goals'")&&shipped.includes("api('/api/author/goals'"),"Workspace must use the authenticated goals API.");
assert.ok(app.includes("esc(story.title")&&shipped.includes("esc(story.title"),"Story titles must be escaped.");
assert.ok(app.includes("authorGoalClear")&&shipped.includes("authorGoalClear"),"Creators must be able to clear goals.");
assert.ok(css.includes(".authorGoalFields")&&css.includes("@media(max-width:560px)"),"Writing goal controls must have a phone layout.");
assert.equal(app,shipped,"Source and served app JavaScript must remain identical.");
console.log("Author writing goals policy, ownership, migration, UI and asset parity checks passed.");
