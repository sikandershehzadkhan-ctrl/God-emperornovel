import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const worker = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const historyPost = worker.split("\n").find(line => line.includes('if(p==="/api/history"&&m==="POST")'));
assert.ok(historyPost, "history write endpoint must exist");
assert.match(historyPost, /Number\.isSafeInteger\(novelId\)/, "novel ID must be a positive safe integer");
assert.match(historyPost, /Number\.isSafeInteger\(chapterNumber\)/, "chapter number must be a positive safe integer");
assert.match(historyPost, /c\.publication_status='published'/, "only published chapters may enter reading history");
assert.match(historyPost, /n\.publication_status='published'/, "only published novels may enter reading history");
assert.match(historyPost, /n\.rights_status IN \('original','public_domain','licensed','authorized'\)/, "rights eligibility must be enforced");
assert.match(historyPost, /chapter\.is_locked&&u\.role!=="admin"/, "locked chapters require an unlock or admin access");
assert.match(historyPost, /FROM unlocks WHERE user_id=\? AND chapter_id=\?/, "unlock ownership must be scoped to the current user and chapter");
assert.match(historyPost, /Unlock this chapter before saving reading progress/, "denied locked chapter writes must explain why");

console.log("Reader history authorization checks passed.");
