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
assert.equal(runtime, app,
  "The served versioned runtime must exactly match the public application source.");

console.log("Reader bookmark toggle and source/runtime parity checks passed.");
