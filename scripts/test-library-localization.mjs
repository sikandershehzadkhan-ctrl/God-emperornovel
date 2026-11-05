import assert from "node:assert/strict";
import fs from "node:fs";

const app=fs.readFileSync("public/app.js","utf8");
const served=fs.readFileSync("public/app-17.23.0.js","utf8");
const html=fs.readFileSync("public/index.html","utf8");
const match=app.match(/const LIBRARY_LANG=(\{[\s\S]*?\});\nfunction applyLibraryTranslations/);
assert.ok(match,"Library locale dictionary must be present");
const dictionaries=JSON.parse(match[1]);
const locales=["en","ur","hi","zh-CN","zh-TW","es","fr","id","ja","ko","pt-BR","ar","vi","fa"];
const keys=["Remove bookmark","My Library","Sign in to save stories and sync your reading across devices.","Your library is available after signing in.","Sign In","Create Account","Your saved stories, reading progress and bookmarks, synced to your account.","History","Following","Continue Reading","Jump back into your most recently read stories.","Saved Stories","Bookmarked Chapters","Your saved chapter positions.","Continue Reading →","No reading history yet. Open a chapter to begin.","Remove from Library","Your library is empty. Open a novel and tap Add to Library.","No bookmarked chapters yet.","Open","Reading History","Your recently read novels and the latest chapters you reached.","No reading history yet. Open a chapter to begin your journey."];
for(const locale of locales){
 assert.ok(dictionaries[locale],"Missing locale: "+locale);
 for(const key of keys)assert.ok(dictionaries[locale][key],"Missing "+locale+" translation: "+key);
}
assert.equal(Object.keys(dictionaries).length,14);
assert.ok(app.includes("...(LIBRARY_LANG[c]||{})"),"Library translations must join the active language dictionary");
assert.ok(app.includes("document.querySelectorAll('[data-in-lang]')"),"Language changes must update marked library/history text");
assert.ok(app.includes("function applyLibraryTranslations(root,language)"),"Shared library translation helper missing");
const libraryAt=app.indexOf("async function library(mode='library')");
const historyAt=app.indexOf("async function history()",libraryAt);
const followingAt=app.indexOf("async function following()",historyAt);
assert.ok(libraryAt>=0&&historyAt>libraryAt&&followingAt>historyAt,"Library, history and following route boundaries must exist");
const library=app.slice(libraryAt,historyAt);
const history=app.slice(historyAt,followingAt);
assert.ok(library.includes("applyLibraryTranslations(root,activeLanguage)"),"Library and following views must localize independently");
assert.ok(history.includes("applyLibraryTranslations(root,language)"),"History route must localize independently");
assert.ok(library.includes("api('/api/bookmark',{method:'DELETE'"),"Library must remove bookmarks through the authenticated API");
assert.ok(library.includes('class="ghost removeBookmark"'),"Saved bookmarks must expose a remove action");
assert.ok(library.includes("Number(x.progress_percent)||0"),"Continue Reading must display saved chapter progress");
assert.ok(library.includes("ratingText(x.rating)")&&!library.includes("Number(x.rating)<=5")&&!library.includes("toFixed(1)"),"Library ratings must preserve the canonical ten-point formatter without fabricated decimals");
assert.ok(library.includes("$('#savedCount').textContent=remaining"),"Removing a story must update the visible library count");
assert.ok(library.includes("if(!remaining)$('#savedList').innerHTML"),"Removing the final story must render the empty-library state");
assert.ok(library.includes("if(!$('.removeBookmark').length)$('#bookmarkList').innerHTML"),"Removing the final bookmark must render the empty-bookmarks state");
assert.equal(app,served,"Served versioned asset must match source app.js");
assert.ok(html.includes("/app-17.23.0.js"),"Public entry must load the synchronized versioned asset");
console.log("Library localization passed: 14 locales, 23 UI strings, history/library scope, explicit bookmark removal, progress display and ten-point rating parity.");
