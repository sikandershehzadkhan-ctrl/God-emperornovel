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

const historyDeleteStart = worker.indexOf('if(p==="/api/history"&&m==="DELETE")');
const historyDeleteEnd = worker.indexOf('if(p==="/api/library"', historyDeleteStart);
const historyDelete = worker.slice(historyDeleteStart, historyDeleteEnd);
assert.ok(historyDelete, "history deletion endpoint must exist");
assert.match(historyDelete, /need\(u\)/, "history deletion must require authentication");
assert.match(historyDelete, /req\.headers\.get\("origin"\)!==url\.origin/, "history deletion must reject cross-origin requests");
assert.match(historyDelete, /DELETE FROM history WHERE user_id=\?/, "history deletion must be scoped to the session owner");
assert.match(historyDelete, /DELETE FROM history WHERE user_id=\? AND novel_id=\?/, "single-entry deletion must be scoped to the session owner and novel");
assert.match(historyDelete, /Number\.isSafeInteger\(novelId\)/, "single-entry deletion must validate the novel id");
const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
assert.match(app, /id="clearHistory"/, "history page must expose a clear-history action");
assert.match(app, /class="ghost removeHistory"/, "history entries must expose individual removal");
assert.match(app, /method:'DELETE'/, "history controls must use the deletion endpoint");
assert.match(app, /Bookmarks and saved stories will remain/, "clear-history confirmation must explain unaffected saved data");
assert.ok(app.includes("function formatDateLabel(value)"), "reading hub must safely format server timestamps");
assert.ok(app.includes("Last read ${esc(formatDateLabel(n.updated_at))}"), "history entries must show their last-read date");
assert.ok(app.includes('class="active" href="/history"'), "history must share the library navigation tabs");
assert.ok(app.includes("Saved ${esc(formatDateLabel(x.created_at))}"), "saved stories must show when they were added");
assert.ok(app.includes(" · Saved ${esc(formatDateLabel(x.updated_at))}"), "bookmarks must show their saved date when supplied");

const bookmarkDeleteStart = worker.indexOf('if(p==="/api/bookmark"&&m==="DELETE")');
const bookmarkDeleteEnd = worker.indexOf('if(p==="/api/bookmark"&&m==="POST")', bookmarkDeleteStart);
const bookmarkDelete = worker.slice(bookmarkDeleteStart, bookmarkDeleteEnd);
assert.ok(bookmarkDelete, "bookmark deletion endpoint must exist");
assert.match(bookmarkDelete, /need\(u\)/, "bookmark deletion must require authentication");
assert.match(bookmarkDelete, /req\.headers\.get\("origin"\)!==url\.origin/, "bookmark deletion must reject cross-origin requests");
assert.ok(bookmarkDelete.includes("DELETE FROM bookmarks WHERE user_id=? AND novel_id=? AND chapter_number=?"), "bookmark deletion must be scoped to the owner and exact bookmark");
assert.ok(app.includes('class="ghost removeBookmark"'), "bookmark list must expose direct removal");
assert.ok(app.includes("method:'DELETE'"), "bookmark removal must use its dedicated deletion endpoint");

assert.ok(app.includes('class="ghost unfollowStory"'), "following page must expose an unfollow action");
assert.ok(app.includes("api('/api/follow',{method:'POST',body:JSON.stringify({novel_id:Number(button.dataset.id)})})"), "unfollow action must use the authenticated follow toggle");
assert.ok(app.includes("Following since '+esc(formatDateLabel(x.created_at))"), "following page must show its saved date when supplied");

assert.ok(worker.includes("LEFT JOIN reading_positions rp ON rp.user_id=h.user_id AND rp.novel_id=h.novel_id"), "history must include the user's saved reading position");
assert.ok(worker.includes("rp.percent progress_percent"), "history must return saved chapter progress");
assert.ok(app.includes('class="reading-progress"'), "library and history must display saved reading progress");
assert.ok(app.includes("progress_chapter_number||x.chapter_number"), "continue reading must resume at the saved reading-position chapter");
assert.ok(app.includes("progress_chapter_number||n.chapter_number"), "history resume link must use the saved reading-position chapter");
