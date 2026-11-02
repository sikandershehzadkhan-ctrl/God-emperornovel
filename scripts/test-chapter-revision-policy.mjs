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
assert.ok(history.includes("ORDER BY id DESC LIMIT 30"), "Revision history must be bounded and newest-first.");
for (const field of ["chapter_id", "chapter_number", "title", "content", "is_locked", "ticket_cost", "editor_user_id", "created_at"]) {
  assert.ok(migration.includes(field), "Revision snapshots must retain " + field + ".");
}
assert.ok(migration.includes("ON DELETE CASCADE"), "Chapter deletion must remove its dependent revisions.");
assert.ok(migration.includes("idx_chapter_revisions_chapter_created"), "Revision history must have a chapter/time index.");
console.log("Chapter revision policy checks passed.");
