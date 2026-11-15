import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/index.js", "utf8");
const app = readFileSync("public/app.js", "utf8");
const runtime = readFileSync("public/app-17.23.0.js", "utf8");

assert.match(source, /if\(p==="\/api\/bookmark"&&m==="POST"\)/,
  "The authenticated bookmark endpoint must exist.");
assert.match(source, /Number\.isSafeInteger\(nid\)/,
  "Bookmark writes must validate the novel identifier.");
assert.match(source, /Number\.isSafeInteger\(chapter\)/,
  "Bookmark writes must validate the chapter number.");
assert.match(source, /bookmarked:false/,
  "Saving the same chapter again must remove the bookmark.");
assert.match(source, /bookmarked:true/,
  "Saving a different chapter must return the saved state.");
assert.match(source, /DELETE FROM bookmarks WHERE user_id=\? AND novel_id=\?/,
  "Unbookmarking must delete only the signed-in user's novel bookmark.");
assert.match(source, /c\.publication_status='published'/,
  "Only published chapters may be bookmarked.");
assert.match(source, /n\.rights_status IN \('original','public_domain','licensed','authorized'\)/,
  "Bookmark writes must enforce published-rights eligibility.");

assert.match(app, /now=!!result\.bookmarked/,
  "The reader button must use the server's authoritative bookmark state.");
assert.match(app, /localStorage\.removeItem\(key\)/,
  "Guest bookmarks must also be removable.");
assert.doesNotMatch(app, /if\(d\.unlocked\)api\('\/api\/bookmark'/,
  "Opening a chapter must not silently create a bookmark.");
assert.match(app, /if\(isFollowing\)\{[\s\S]*?api\('\/api\/follows'\)/,
  "The Following page must fetch the signed-in user's followed stories.");
assert.match(app, /id="followedList"/,
  "The Following page must render a dedicated followed-stories list.");
assert.match(app, /You are not following any stories yet/,
  "The Following page must provide an accurate empty state.");
assert.match(app, /if\(isFollowing\)[\s\S]*?return;[\s\S]*?const \[items,historyRows,bookmarks\]/,
  "The Following page must not fall through to the saved-library renderer.");

const historyPost = source.split("\\n").find(line => line.includes('if(p==="/api/history"&&m==="POST")'));
assert.ok(historyPost, "history write endpoint must exist");
assert.match(historyPost, /Number\\.isSafeInteger\\(novelId\\)/, "novel ID must be validated");
assert.match(historyPost, /Number\\.isSafeInteger\\(chapterNumber\\)/, "chapter number must be validated");
assert.match(historyPost, /c\\.publication_status='published'/, "only published chapters may enter reading history");
assert.match(historyPost, /n\\.publication_status='published'/, "only published novels may enter reading history");
assert.match(historyPost, /n\\.rights_status IN \\('original','public_domain','licensed','authorized'\\)/, "rights eligibility must be enforced");
assert.match(historyPost, /chapter\\.is_locked&&u\\.role!==\\"admin\\"/, "locked chapters require unlock or admin access");
assert.match(historyPost, /FROM unlocks WHERE user_id=\\? AND chapter_id=\\?/, "unlock ownership must be scoped to the signed-in user");
assert.match(historyPost, /Unlock this chapter before saving reading progress/, "denied locked chapter writes must explain why");

assert.equal(runtime, app,
  "The served versioned runtime must exactly match the public application source.");

console.log("Reader bookmark toggle and source/runtime parity checks passed.");
