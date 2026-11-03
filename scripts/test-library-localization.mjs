import fs from 'node:fs';
import assert from 'node:assert/strict';

const app = fs.readFileSync('public/app.js', 'utf8');
const served = fs.readFileSync('public/app-17.24.0.js', 'utf8');
const html = fs.readFileSync('public/index.html', 'utf8');
const match = app.match(/const LIBRARY_LANG=(\{[\s\S]*?\});\nfunction applyLibraryTranslations/);
assert.ok(match, 'Library locale dictionary must be present');
const dictionaries = JSON.parse(match[1]);
const locales = ['en','ur','hi','zh-CN','zh-TW','es','fr','id','ja','ko','pt-BR','ar','vi','fa'];
const keys = ['Remove bookmark','My Library','Sign in to save stories and sync your reading across devices.','Your library is available after signing in.','Sign In','Create Account','Your saved stories, reading progress and bookmarks, synced to your account.','History','Following','Continue Reading','Jump back into your most recently read stories.','Saved Stories','Bookmarked Chapters','Your saved chapter positions.','Continue Reading →','No reading history yet. Open a chapter to begin.','Remove from Library','Your library is empty. Open a novel and tap Add to Library.','No bookmarked chapters yet.','Open','Reading History','Your recently read novels and the latest chapters you reached.','No reading history yet. Open a chapter to begin your journey.'];
for (const locale of locales) {
  assert.ok(dictionaries[locale], 'Missing locale: ' + locale);
  for (const key of keys) assert.ok(dictionaries[locale][key], 'Missing ' + locale + ' translation: ' + key);
}
assert.equal(Object.keys(dictionaries).length, 14);
assert.ok(app.includes('function applyLibraryTranslations(root,language)'), 'Shared Library translation helper missing');
assert.ok(app.includes('async function library(mode='), 'Library handler missing');
assert.ok(app.includes("applyLibraryTranslations(root,language)"), 'History route must localize independently');
assert.ok(!app.slice(app.indexOf('async function history()'),app.indexOf('async function following()')).includes('localizeLibrary()'), 'History must not call a Library-scoped closure');
assert.equal(app, served, 'Served versioned asset must match source app.js');
assert.ok(html.includes('/app-17.24.0.js'));

const libraryAt=app.indexOf("async function library(mode=");
const libraryEnd=app.indexOf("\\nasync function history()",libraryAt);
assert.ok(libraryAt>=0&&libraryEnd>libraryAt,"Library page must exist.");
const library=app.slice(libraryAt,libraryEnd);
assert.ok(library.includes("api('/api/bookmark',{method:'DELETE'"),"Library must remove bookmarks through the authenticated API.");
assert.ok(library.includes('class="removeBookmark"'),"Saved bookmarks must expose a remove action.");
assert.ok(library.includes("Number(x.progress_percent)||0"),"Continue Reading must display saved chapter progress.");
assert.ok(library.includes("Math.round(Number(x.rating))")&&!library.includes("toFixed(1)"),"Library ratings must use whole-number values and avoid fabricated zero ratings.");
assert.ok(library.includes("$('#savedCount').textContent=remaining"),"Removing a story must update the visible library count.");
assert.ok(library.includes("if(!remaining)$('#savedList').innerHTML"),"Removing the final story must render the empty-library state.");
console.log('Library localization passed: 14 locales, 22 UI strings, library/history scope guard, and source/served parity.');
