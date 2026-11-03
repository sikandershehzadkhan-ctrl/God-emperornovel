import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync("public/app.js", "utf8");
const versioned = readFileSync("public/app-17.23.0.js", "utf8");
const worker = readFileSync("src/index.js", "utf8");
const libraryStart = app.indexOf("async function library(");
const libraryEnd = app.indexOf("async function history(", libraryStart);
assert.ok(libraryStart >= 0 && libraryEnd > libraryStart, "Library renderer must exist");
const library = app.slice(libraryStart, libraryEnd);
assert.match(library, /account-synced chapter history and bookmarks/i,
  "Library copy must describe the server-synced data accurately");
assert.match(library, /Scroll position is saved on this device/i,
  "Library must disclose that scroll percentage is device-local");

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

assert.equal(versioned, app, "The cache-versioned reader bundle must remain byte-for-byte synchronized with app.js");
console.log("PASS: reader progress labels distinguish local scroll position from account-synced chapter history.");
