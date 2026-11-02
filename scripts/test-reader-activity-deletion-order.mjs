import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const runtime = readFileSync(new URL("../public/app-17.23.0.js", import.meta.url), "utf8");

assert.equal(runtime, app, "Served runtime must exactly match editable application source.");
const start = app.indexOf("async function discardQueuedReaderActivityForNovel(novelId){");
const end = app.indexOf("\nasync function queueReaderActivity", start);
assert.ok(start >= 0 && end > start, "A dedicated offline activity discard helper must exist.");
const helper = app.slice(start, end);
assert.ok(helper.includes("await readerActivityFlushPromise"), "Deletion must wait for an active same-tab queue flush to settle.");
assert.ok(helper.includes("readReaderActivityQueue()"), "Deletion must inspect the persisted session queue after waiting.");
assert.ok(helper.includes("item=>Number(item.novel_id)!==Number(novelId)"), "Deletion must remove every queued record for the selected novel.");
assert.ok(helper.includes("writeReaderActivityQueue(queue)"), "Remaining queued activity for other novels must be preserved.");
assert.ok(helper.includes("sessionStorage.removeItem(READER_ACTIVITY_QUEUE_KEY)"), "An emptied queue must be removed.");

const historyHandler = app.indexOf("await discardQueuedReaderActivityForNovel(Number(b.dataset.id));await api('/api/history?novel_id='");
const bookmarkHandler = app.indexOf("await discardQueuedReaderActivityForNovel(Number(b.dataset.id));await api('/api/bookmarks?novel_id='");
assert.ok(historyHandler >= 0, "History removal must discard queued activity before the DELETE request.");
assert.ok(bookmarkHandler >= 0, "Bookmark removal must discard queued activity before the DELETE request.");
assert.ok(historyHandler < app.indexOf("method:'DELETE'", historyHandler), "History queue cleanup must precede its server deletion.");
assert.ok(bookmarkHandler < app.indexOf("method:'DELETE'", bookmarkHandler), "Bookmark queue cleanup must precede its server deletion.");

console.log("PASS: same-tab history and bookmark deletion waits for active offline replay, removes stale queued activity for that novel, and preserves other novels' queued records.");
