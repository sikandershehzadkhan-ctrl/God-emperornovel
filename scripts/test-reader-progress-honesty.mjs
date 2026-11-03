import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync("public/app.js", "utf8");
const versioned = readFileSync("public/app-17.23.0.js", "utf8");
const worker = readFileSync("src/index.js", "utf8");
const progressMigration = readFileSync("migrations/0013_reader_progress.sql", "utf8");
const readerCss = readFileSync("public/imperial-design-foundation.css", "utf8");
const libraryStart = app.indexOf("async function library(");
const libraryEnd = app.indexOf("async function history(", libraryStart);
assert.ok(libraryStart >= 0 && libraryEnd > libraryStart, "Library renderer must exist");
const library = app.slice(libraryStart, libraryEnd);
assert.match(library, /account-synced chapter history, reading progress and bookmarks/i,
  "Library copy must describe account-synced scroll progress accurately");
assert.ok(library.includes("x.progress_chapter||x.chapter_number") && library.includes("x.progress_percent"),
  "Continue Reading must display and resume the saved chapter progress when available");

const readerStart = app.indexOf("async function reader(){");
const readerEnd = app.indexOf("async function authPage(", readerStart);
assert.ok(readerStart >= 0 && readerEnd > readerStart, "Reader renderer must exist");
const reader = app.slice(readerStart, readerEnd);
assert.doesNotMatch(reader, /initialNovelProgress|through novel/,
  "Reader must not estimate whole-novel progress from chapter number");
assert.match(reader, /readerProgressBar[^\n]*chapterPct/,
  "Progress bar must start from an actual saved chapter scroll percentage");
assert.match(reader, /saved on this device/,
  "Reader must disclose the local scope of scroll progress");
assert.match(reader, /readerProgress:\x27\+id/,
  "Reader must retain its local scroll-position persistence key");


assert.match(worker, /if\(p===\"\/api\/bookmark\"&&m===\"POST\"\)[\s\S]*?Number\.isSafeInteger\(novelId\)[\s\S]*?Number\.isSafeInteger\(chapterNumber\)/,
  "Bookmark writes must reject missing, fractional, unsafe or non-positive identifiers");
assert.match(worker, /if\(p===\"\/api\/bookmark\"&&m===\"DELETE\"\)[\s\S]*?DELETE FROM bookmarks WHERE user_id=\? AND novel_id=\? AND chapter_number=\?/,
  "Bookmark removal must be scoped to the authenticated user and exact novel/chapter");
assert.match(reader, /method:saved\?'DELETE':'POST'/,
  "Signed-in readers must be able to explicitly add and remove their current chapter bookmark");
assert.doesNotMatch(reader, /api\('\/api\/bookmark',\{method:'POST',body:JSON\.stringify\(\{novel_id:Number\(id\),chapter_number:num\}\)\}\)\.catch/,
  "Opening a chapter must not silently overwrite the user's deliberate bookmark");
assert.match(reader, /readerBookmark:\x27\+id/,
  "Guest bookmark state must remain device-local and available to the reader");
assert.match(worker, /if\(p===\"\/api\/history\"&&m===\"POST\"\)[\s\S]*?Number\.isSafeInteger\(novelId\)[\s\S]*?Number\.isSafeInteger\(chapterNumber\)/,
  "History writes must reject missing, fractional, unsafe or non-positive identifiers");
assert.match(worker, /FROM chapters c JOIN novels n ON n\.id=c\.novel_id WHERE c\.novel_id=\? AND c\.chapter_number=\? AND c\.publication_status='published' AND n\.publication_status='published'/,
  "History and bookmark writes must target an actually published chapter of a published novel");


assert.ok(worker.includes('if(p==="/api/history"&&m==="GET")') && worker.includes("LEFT JOIN reader_progress rp ON rp.user_id=h.user_id AND rp.novel_id=h.novel_id") && worker.includes("rp.progress_percent"),
  "History must return the authenticated user's saved reader progress for library resume");
assert.match(worker, /if\(p===\"\/api\/reader-progress\"&&m===\"GET\"\)[\s\S]*?need\(u\)[\s\S]*?reader_progress WHERE user_id=\? AND novel_id=\?/,
  "Cross-device progress reads must require authentication and be scoped to the session user");
assert.match(worker, /if\(p===\"\/api\/reader-progress\"&&m===\"POST\"\)[\s\S]*?Number\.isSafeInteger\(progressPercent\)[\s\S]*?progressPercent>100[\s\S]*?reader_progress\(user_id,novel_id,chapter_number,progress_percent/,
  "Cross-device progress writes must validate bounded integer percentages and use account-scoped upserts");
assert.match(progressMigration, /PRIMARY KEY \(user_id, novel_id\)/,
  "Reader progress must have one latest reading position per account and novel");
assert.match(progressMigration, /CHECK \(progress_percent BETWEEN 0 AND 100\)/,
  "Reader progress storage must constrain percentages to 0 through 100");
assert.match(reader, /api\('\/api\/reader-progress\?novel_id='/,
  "Signed-in readers must load saved progress from their account");
assert.ok(reader.includes("fetch('/api/reader-progress'") && reader.includes("keepalive:true"), "Reader progress must flush during page exit where the browser permits it");
assert.match(reader, /synced to your account/,
  "Signed-in reader UI must disclose account synchronization");


assert.match(readerCss, /@media\(max-width:480px\)[\s\S]*?readerActions\{grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)\}/,
  "Reader navigation must reflow into two usable columns on narrow phones");
assert.match(readerCss, /readerActions a,.readerFooterCard>a\{[\s\S]*?min-height:44px/,
  "Reader navigation links must meet the 44px touch-target minimum");

assert.equal(versioned, app, "The cache-versioned reader bundle must remain byte-for-byte synchronized with app.js");
console.log("PASS: reader progress labels distinguish local scroll position from account-synced chapter history.");
