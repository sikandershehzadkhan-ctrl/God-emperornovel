import assert from "node:assert/strict";
import fs from "node:fs";
import { parseReaderProgressTarget } from "../src/reader-progress-policy.mjs";

for (const [payload, expected] of [
  [{ novel_id: 1, chapter_number: 1 }, { ok: true, novelId: 1, chapterNumber: 1 }],
  [{ novel_id: "12", chapter_number: "4" }, { ok: true, novelId: 12, chapterNumber: 4 }],
]) assert.deepEqual(parseReaderProgressTarget(payload), expected);

for (const payload of [
  {}, { novel_id: 0, chapter_number: 1 }, { novel_id: -1, chapter_number: 1 },
  { novel_id: 1.5, chapter_number: 1 }, { novel_id: Number.MAX_SAFE_INTEGER + 1, chapter_number: 1 },
  { novel_id: 1, chapter_number: 0 }, { novel_id: 1, chapter_number: -1 },
  { novel_id: 1, chapter_number: 1.5 }, { novel_id: 1, chapter_number: Number.MAX_SAFE_INTEGER + 1 },
  { novel_id: "not-a-number", chapter_number: 1 }, { novel_id: 1, chapter_number: "nope" },
]) assert.equal(parseReaderProgressTarget(payload).ok, false);

const worker=fs.readFileSync("src/index.js","utf8");
const bookmarkStart=worker.indexOf('if(p==="/api/bookmark"&&m==="POST")');
const historyStart=worker.indexOf('if(p==="/api/history"&&m==="POST")');
assert.notEqual(bookmarkStart,-1);
assert.notEqual(historyStart,-1);
const bookmark=worker.slice(bookmarkStart,worker.indexOf('if(p==="/api/history"&&m==="GET")',bookmarkStart));
const history=worker.slice(historyStart,worker.indexOf('if(p==="/api/library"&&m==="GET")',historyStart));
for(const [name,route] of [["bookmark",bookmark],["history",history]]){
  assert.ok(route.includes("parseReaderProgressTarget(await body(req))"),name+" must use shared integer validation");
  assert.ok(route.includes("JOIN chapters c ON c.novel_id=n.id"),name+" must bind the chapter to the requested novel");
  assert.ok(route.includes("c.publication_status='published'"),name+" must reject unpublished chapters");
  assert.ok(route.includes("n.publication_status='published'"),name+" must reject unpublished novels");
  assert.ok(route.indexOf("parseReaderProgressTarget")<route.indexOf("INSERT INTO "+(name==="bookmark"?"bookmarks":"history")),name+" must validate before writing");
}
console.log("Reader bookmark/history target validation tests passed.");
