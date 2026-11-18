import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const patchAt = worker.indexOf('if(/^\\/api\\/author\\/chapters\\/\\d+$/.test(p)&&m==="PATCH")');
assert.ok(patchAt >= 0, "Author chapter PATCH route must exist");
const patchEnd = worker.indexOf("\n }", patchAt);
const patch = worker.slice(patchAt, patchEnd > patchAt ? patchEnd : patchAt + 3000);
assert.ok(patch.includes("n.kind FROM chapters c JOIN novels n"), "Chapter PATCH must load the parent novel format");
assert.ok(patch.includes("validateComicChapterContent(content)"), "Chapter PATCH must apply the comic validator");
assert.ok(patch.includes("if(!comicCheck.ok)return json({error:comicCheck.error},400)"), "Invalid comic edits must be rejected");

const bookmarkAt = worker.indexOf('if(p==="/api/bookmark"&&m==="POST")');
assert.ok(bookmarkAt >= 0, "Bookmark POST route must exist");
const bookmarkEnd = worker.indexOf("\n if(", bookmarkAt);
const bookmark = worker.slice(bookmarkAt, bookmarkEnd > bookmarkAt ? bookmarkEnd : bookmarkAt + 2500);
assert.ok(bookmark.includes("Number.isSafeInteger(nid)") && bookmark.includes("nid<1"), "Bookmark novel ID must be a positive safe integer");
assert.ok(bookmark.includes("Number.isSafeInteger(chapterNumber)") && bookmark.includes("chapterNumber<1"), "Bookmark chapter number must be a positive safe integer");
assert.ok(bookmark.includes("JOIN chapters c ON c.novel_id=n.id"), "Bookmark target must belong to the selected novel");
assert.ok(bookmark.includes("c.chapter_number=?"), "Bookmark target must match the selected chapter number");
assert.ok(bookmark.includes("n.publication_status='published'"), "Bookmark novel must be published");
assert.ok(bookmark.includes("n.rights_status IN ('original','public_domain','licensed','authorized')"), "Bookmark novel must be rights eligible");
assert.ok(bookmark.includes("c.publication_status='published'"), "Bookmark chapter must be published");
assert.ok(bookmark.includes(".bind(u.id,nid,chapterNumber)"), "Bookmark writes must use normalized IDs and the authenticated user ID");
console.log("API resource validation tests passed: comic chapter edits and bookmark targets.");
