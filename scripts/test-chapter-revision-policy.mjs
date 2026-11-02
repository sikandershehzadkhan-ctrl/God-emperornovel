import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/index.js", "utf8");
const migration = fs.readFileSync("migrations/0012_chapter_revisions.sql", "utf8");
const patchAt = source.indexOf('if(/^\\/api\\/author\\/chapters\\/\\d+$/.test(p)&&m==="PATCH")');
const revisionsAt = source.indexOf('if(/^\\/api\\/author\\/chapters\\/\\d+\\/revisions$/.test(p)&&m==="GET")');
assert.ok(patchAt >= 0, "Author chapter PATCH route must exist.");
assert.ok(revisionsAt > patchAt, "Revision history GET route must follow the chapter edit route.");
const patch = source.slice(patchAt, revisionsAt);
assert.ok(patch.includes("n.owner_user_id"), "Chapter edits must load the novel owner.");
assert.ok(patch.includes("You do not own this chapter"), "Chapter edits must enforce novel ownership.");
assert.ok(patch.includes("env.DB.batch(["), "Revision snapshot and chapter update must run atomically.");
assert.ok(patch.includes("INSERT INTO chapter_revisions"), "A prior version must be snapshotted before a changed chapter is saved.");
assert.ok(patch.includes("validateComicChapterContent(content)"), "Edited comic chapter payloads must be revalidated.");
assert.ok(patch.includes("content.length>100000"), "Edited chapter content must have a size limit.");
const history = source.slice(revisionsAt, source.indexOf('if(/^\\/api\\/author\\/chapters\\/\\d+\\/publish$/.test(p)&&m==="POST")', revisionsAt));
assert.ok(history.includes("You do not own this chapter"), "Revision history must enforce the same ownership boundary.");
assert.ok(history.includes("ORDER BY id DESC LIMIT 10"), "Revision history must be bounded and newest-first.");
for (const field of ["chapter_id", "chapter_number", "title", "content", "is_locked", "ticket_cost", "editor_user_id", "created_at"]) {
  assert.ok(migration.includes(field), "Revision snapshots must retain " + field + ".");
}
assert.ok(migration.includes("ON DELETE CASCADE"), "Chapter deletion must remove its dependent revisions.");
assert.ok(migration.includes("idx_chapter_revisions_chapter_created"), "Revision history must have a chapter/time index.");
const app = fs.readFileSync("public/app.js", "utf8");
const shipped = fs.readFileSync("public/app-17.24.0.js", "utf8");
const css = fs.readFileSync("public/app-17.24.0.css", "utf8");
for (const [label, browser] of [["source", app], ["served asset", shipped]]) {
  assert.ok(browser.includes("async function openAuthorChapterManager"), label + " must provide the chapter management view.");
  assert.ok(browser.includes("authorManageChapters"), label + " must expose chapter management from each story.");
  assert.ok(browser.includes("authorChapterEditForm"), label + " must provide chapter editing.");
  assert.ok(browser.includes("method:'PATCH'"), label + " must save chapter edits through the owner-scoped API.");
  assert.ok(browser.includes("/revisions"), label + " must expose revision history.");
  assert.ok(browser.includes("A revision snapshot is created automatically"), label + " must explain automatic snapshots.");
  assert.ok(browser.includes("authorChapterPublishToggle"), label + " must expose chapter publication controls.");
  assert.ok(browser.includes("/publish',{method:'POST'"), label + " must call the owner-scoped publication endpoint.");
  assert.ok(browser.includes("Move to draft"), label + " must allow an author to unpublish a chapter.");
  assert.ok(browser.includes("Publish chapter"), label + " must allow an author to publish a chapter.");
  assert.ok(browser.includes("$('.authorChapterHistoryToggle',manager).forEach"), label + " must bind all revision-history controls.");
  assert.doesNotMatch(browser, /(?<!\$)\$\('\.authorChapterHistoryToggle',manager\)\.forEach/, label + " must not use a single-element selector for revision-history controls.");
}
assert.equal(app, shipped, "Source and served app assets must remain identical.");
assert.ok(css.includes(".authorChapterManager") && css.includes(".authorRevisionItem"), "Chapter management and revision history need responsive styling.");
const publishAt = source.indexOf('if(/^\\/api\\/author\\/chapters\\/\\d+\\/publish$/.test(p)&&m==="POST")');
assert.ok(publishAt >= 0, "Author chapter publication endpoint must exist.");
const publish = source.slice(publishAt, source.indexOf('if(p==="/api/admin/publishing"', publishAt));
assert.ok(publish.includes("You do not own this chapter"), "Chapter publishing must enforce story ownership.");
assert.ok(publish.includes("['draft','published']"), "Chapter publication status must be limited to draft or published.");
assert.ok(publish.includes("rights_status"), "Chapter publication must check the novel's rights status.");
assert.ok(publish.includes("author_chapter_published"), "Publishing must be audit logged.");
assert.ok(publish.includes("author_chapter_unpublished"), "Unpublishing must be audit logged.");
console.log("Chapter revision policy and UI checks passed.");
