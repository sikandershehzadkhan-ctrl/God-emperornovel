import assert from "node:assert/strict";
import fs from "node:fs";

const creator=fs.readFileSync("src/features/creator-studio/index.mjs","utf8");
const publishing=fs.readFileSync("src/features/publishing-studio/index.mjs","utf8");
const worker=fs.readFileSync("src/index.js","utf8");

for(const route of [
  '"/api/author/analytics"',
  '"/api/author/feedback"',
  '"/api/author/goals"',
  '"/api/author/notes"',
  '"/api/author/readiness"',
  '"/api/author/planning"'
]) assert.ok(creator.includes(route),"Creator-owned endpoint missing: "+route);

assert.ok(!creator.includes('"/api/author/schedules"'),"release calendar must not be owned by Creator");
assert.ok(!creator.includes("/api/author/chapters/"),"chapter lifecycle routes must not be owned by Creator");
assert.ok(publishing.includes('"/api/author/schedules"'),"release calendar must be owned by Publishing");
for(const route of [
  "chapters",
  "revisions",
  "publish",
  "schedule"
]) assert.ok(publishing.includes(route),"Publishing chapter lifecycle route missing: "+route);

for(const fragment of [
  "FROM novels n WHERE n.owner_user_id=?",
  "WHERE n.owner_user_id=?",
  "pn.owner_user_id=?",
  "AND n.owner_user_id=?",
  "WHERE id=? AND owner_user_id=?"
]) assert.ok(creator.includes(fragment),"Creator owner-scope predicate missing: "+fragment);

assert.ok(publishing.includes("WHERE n.owner_user_id=?"),"release calendar must filter by authenticated owner");
assert.ok(publishing.includes("if(Number(c.owner_user_id)!==Number(u.id))"),"schedule route must enforce strict chapter owner");
assert.ok(publishing.includes("if(Number(c.owner_user_id)!==Number(u.id))return json({error:'You do not own this chapter'},403)"),"revision route must enforce strict chapter owner");

assert.ok(worker.includes("handleCreatorStudioRequest"),"Worker must compose Creator Studio");
assert.ok(worker.includes("handlePublishingStudioRequest"),"Worker must compose Publishing Studio");
assert.ok(worker.includes("publishDueChapters"),"Worker must compose scheduled publication");
assert.ok(worker.includes("await runAutomation(env,event.cron)"),"scheduled publishing must preserve the existing scheduled agent automation");

const dueQuery=publishing.slice(publishing.indexOf("export async function publishDueChapters"));
assert.ok(dueQuery.includes("n.id AS novel_id"),"due publication must project the parent novel id");
assert.ok(dueQuery.includes("DELETE FROM scheduled_chapter_publications WHERE NOT EXISTS"),"stale schedule cleanup must remain");
assert.ok(dueQuery.includes("changes()=1"),"dependent D1 writes must be gated by the previous successful write");
assert.ok(dueQuery.includes("row.novel_id"),"parent novel timestamp update must use the selected novel id");
assert.ok(dueQuery.includes("if(changed===1)"),"notification must depend on a successful chapter transition");

console.log("Creator/Publishing domain boundary and scheduler source checks passed.");
