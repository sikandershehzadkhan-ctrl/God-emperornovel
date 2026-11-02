import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const runtime = readFileSync(new URL("../public/app-17.23.0.js", import.meta.url), "utf8");
const migration = readFileSync(new URL("../migrations/0012_reader_activity_versions.sql", import.meta.url), "utf8");

assert.equal(runtime, app, "Served runtime must match editable app source.");
assert.match(migration, /CREATE TABLE IF NOT EXISTS reader_activity_versions/i);
assert.match(migration, /history_version INTEGER NOT NULL DEFAULT 0 CHECK\(history_version >= 0\)/i);
assert.match(migration, /bookmark_version INTEGER NOT NULL DEFAULT 0 CHECK\(bookmark_version >= 0\)/i);
assert.match(migration, /PRIMARY KEY\(user_id,novel_id\)/i);
assert.ok(source.includes("CREATE TABLE IF NOT EXISTS reader_activity_versions"), "First-run schema bootstrap must create the revision table too.");

const versionAt = source.indexOf('if(p==="/api/reader-activity-version"&&m==="GET")');
const historyDeleteAt = source.indexOf('if(p==="/api/history"&&m==="DELETE")');
const historyPostAt = source.indexOf('if(p==="/api/history"&&m==="POST")');
const bookmarkPostAt = source.indexOf('if(p==="/api/bookmark"&&m==="POST")');
const bookmarkDeleteAt = source.indexOf('if(p==="/api/bookmarks"&&m==="DELETE")');
assert.ok(versionAt >= 0 && historyDeleteAt > versionAt && historyPostAt > historyDeleteAt && bookmarkPostAt >= 0 && bookmarkDeleteAt > bookmarkPostAt, "Revision and activity routes must remain present.");

const versionRoute = source.slice(versionAt, historyDeleteAt);
assert.ok(versionRoute.includes("need(u)"), "Revision lookup must be authenticated.");
assert.ok(versionRoute.includes("history_version") && versionRoute.includes("bookmark_version"), "Revision lookup must return independent history and bookmark versions.");

const historyDelete = source.slice(historyDeleteAt, historyPostAt);
assert.ok(historyDelete.includes("env.DB.batch("), "History deletion and revision increment must be one atomic D1 batch.");
assert.ok(historyDelete.includes("history_version=history_version+1"), "History deletion must advance the history revision.");
assert.ok(historyDelete.includes("DELETE FROM history WHERE user_id=? AND novel_id=?"), "History deletion must remain account and novel scoped.");

const historyWrite = source.slice(historyPostAt, source.indexOf('if(p==="/api/library"', historyPostAt));
assert.ok(historyWrite.includes("b.history_version"), "History writes must carry a server-issued revision.");
assert.ok(historyWrite.includes("SELECT ?,?,? WHERE ?=COALESCE((SELECT history_version"), "History writes must be conditional on the current revision in the SQL write itself.");
assert.ok(historyWrite.includes('code:"stale_activity_version"'), "Stale history writes must return a machine-readable conflict.");

const bookmarkWrite = source.slice(bookmarkPostAt, source.indexOf('if(p==="/api/history"&&m==="GET"', bookmarkPostAt));
assert.ok(bookmarkWrite.includes("b.bookmark_version"), "Bookmark writes must carry a server-issued revision.");
assert.ok(bookmarkWrite.includes("SELECT ?,?,? WHERE ?=COALESCE((SELECT bookmark_version"), "Bookmark writes must be conditional on the current revision in the SQL write itself.");
assert.ok(bookmarkWrite.includes('code:"stale_activity_version"'), "Stale bookmark writes must return a machine-readable conflict.");

const bookmarkDelete = source.slice(bookmarkDeleteAt, source.indexOf('if(p==="/api/novel-reactions"', bookmarkDeleteAt));
assert.ok(bookmarkDelete.includes("env.DB.batch("), "Bookmark deletion and revision increment must be one atomic D1 batch.");
assert.ok(bookmarkDelete.includes("bookmark_version=bookmark_version+1"), "Bookmark deletion must advance only the bookmark revision.");
assert.ok(bookmarkDelete.includes("DELETE FROM bookmarks WHERE user_id=? AND novel_id=?"), "Bookmark deletion must remain account and novel scoped.");

assert.ok(app.includes("getReaderActivityVersion(") && app.includes("/api/reader-activity-version?novel_id="), "Reader must fetch server-issued activity revisions.");
assert.ok(app.includes("history_version:versions.history_version") && app.includes("bookmark_version:versions.bookmark_version"), "Offline queue records must preserve both revisions.");
assert.ok(app.includes("record[kind+'_pending']=false"), "A stale queued dimension must be discarded without retrying it forever.");
assert.ok(app.includes("result.reason?.data?.code==='stale_activity_version'"), "Stale queued requests must be recognized and discarded safely.");
assert.ok(app.includes("bookmark_version:versions.bookmark_version"), "Direct bookmark writes must also carry a revision.");

console.log("PASS: server-side activity revisions are authenticated, independently versioned, atomically advanced on deletion, enforced inside conditional SQL writes, and carried through offline queue replay.");
