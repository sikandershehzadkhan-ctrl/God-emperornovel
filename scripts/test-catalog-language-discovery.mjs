import assert from "node:assert/strict";
import fs from "node:fs";

const app=fs.readFileSync("public/app.js","utf8");
const shipped=fs.readFileSync("public/app-17.24.0.js","utf8");
const worker=fs.readFileSync("src/index.js","utf8");
const catalogAt=app.indexOf("async function catalog()");
const catalogEnd=app.indexOf("async function formatDirectory()",catalogAt);
assert.ok(catalogAt>=0&&catalogEnd>catalogAt,"Catalog page must exist.");
const catalog=app.slice(catalogAt,catalogEnd);
assert.ok(catalog.includes('name="language" list="catalogLanguageOptions"'),"Catalog language filter must offer guided suggestions while remaining free-text.");
assert.ok(catalog.includes('placeholder="Choose or type a language"')&&!catalog.includes('<select name="language"'),"Language discovery must keep custom language names available.");
const catalogList=catalog.match(/<datalist id="catalogLanguageOptions">([\s\S]*?)<\/datalist>/);
const authorList=app.match(/<datalist id="imperialLanguageOptions">([\s\S]*?)<\/datalist>/);
assert.ok(catalogList&&authorList,"Catalog and author forms must expose language suggestions.");
const values=html=>[...html.matchAll(/<option value="([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(values(catalogList[1]),values(authorList[1]),"Discovery and creator forms must use the same canonical language suggestions.");
for(const language of ["English","Urdu","Hindi","Chinese (Simplified)","Chinese (Traditional)","Japanese","Korean","Arabic","Spanish","French","Indonesian","Portuguese","German","Russian","Turkish","Thai","Vietnamese","Bengali","Persian","Italian","Polish","Filipino"])assert.ok(values(catalogList[1]).includes(language),"Missing language suggestion: "+language);
assert.ok(catalog.includes("for(const [k,v] of f.entries())"),"Catalog form must preserve the selected language filter in its query.");
assert.ok(worker.includes('if(language){sql+=" AND LOWER(n.language)=LOWER(?)";a.push(language)}'),"Catalog language matching must remain case-insensitive and parameterized.");

const languageBlock=app.match(/const IN_LANG=(\{[\s\S]*?\});function setINLang/);
assert.ok(languageBlock,"Interface language dictionary must be available.");
const languageDictionary=JSON.parse(languageBlock[1]);
assert.equal(Object.keys(languageDictionary).length,14,"The interface must retain all 14 supported UI languages.");

const readerAt=app.indexOf("async function reader()");
const readerEnd=app.indexOf("\n}\nasync function authPage",readerAt);
assert.ok(readerAt>=0&&readerEnd>readerAt,"Reader implementation must exist.");
const reader=app.slice(readerAt,readerEnd);
for(const key of ["Chapter","← Chapters","Chapter List","Close","Theme","Line spacing","Text width","Compact","Comfort","Relaxed","Focused","Standard","Wide","Keep reading","Next Chapter →","Novel Overview","← Previous","Next →","Unlock Chapter","Open Crown Vault","Chapter locked","Authorized chapter"]) {
  assert.ok(reader.includes("data-in-lang>"+key), "Reader UI must mark "+key+" for translation.");
  for(const locale of Object.keys(languageDictionary))assert.ok(languageDictionary[locale][key], "Missing "+key+" translation for "+locale);
}
assert.ok(app.includes("document.querySelectorAll('[data-in-lang]')"),"Language switching must translate dynamically rendered reader labels.");
assert.ok(reader.includes("setINLang(document.documentElement.lang||'en')"),"Reader must apply the selected language after rendering.");
assert.ok(reader.includes("content.dir=/^(ur|ar|fa|persian|arabic|urdu)$/i.test(String(n.language||''))"),"Chapter text direction must follow the story language, not only the interface language.");

for(const key of ["Sort","Status","Type","Minimum Rating","Apply Filters","Browse Genres","Browse Tags","Advanced Search","Active filters","Clear all","Clear"]) {
  assert.ok(catalog.includes("data-in-lang>"+key), "Catalog UI must mark "+key+" for translation.");
  for(const locale of Object.keys(languageDictionary))assert.ok(languageDictionary[locale][key], "Missing catalog label "+key+" translation for "+locale);
}
assert.ok(catalog.includes("catalogTitle.dataset.inLang=''"),"Catalog heading must be localized after its page template renders.");
for(const locale of Object.keys(languageDictionary))assert.ok(languageDictionary[locale]["Discover your next world"],"Missing catalog heading translation for "+locale);
assert.ok(catalog.includes("renderFilterChips();setINLang(document.documentElement.lang||'en')"),"Dynamic active filter chips must apply the selected language.");
assert.ok(catalog.includes('data-in-lang>← Previous')&&catalog.includes('data-in-lang>Next →'),"Catalog pagination labels must be localizable.");

const homeAt=app.indexOf("async function home()");
const homeEnd=app.indexOf("\nasync function ",homeAt+10);
assert.ok(homeAt>=0&&homeEnd>homeAt,"Homepage implementation must exist.");
const home=app.slice(homeAt,homeEnd);
for(const key of ["Open a world.","Shape an empire.","Discover stories worth staying up for, then create the worlds only you can imagine.","Search titles, tropes, worlds...","Find your story","Original. Authorized. Reader-first.","Start with the kind of story","you love.","Novels and fanfiction are at the heart of Imperial Novel. Explore other formats whenever you're ready.","All formats"]) {
  assert.ok(home.includes("data-in-lang>"+key)||home.includes('data-in-lang-placeholder="'+key+'"'),"Homepage must mark "+key+" for localization.");
  for(const locale of Object.keys(languageDictionary))assert.ok(languageDictionary[locale][key],"Missing homepage translation for "+key+" in "+locale);
}
assert.ok(app.includes("document.querySelectorAll('[data-in-lang-placeholder]')"),"Language switching must translate homepage search placeholders.");
assert.ok(app.includes("input[aria-label]"),"Homepage search accessibility label must follow the selected language.");
assert.ok(home.includes('setINLang(document.documentElement.lang||"en")'),"Homepage must apply the selected language after rendering.");
assert.equal(app,shipped,"Served JavaScript must match the source.");


const genresAt=app.indexOf("async function genres()");
const tagsAt=app.indexOf("async function tags()",genresAt);
const searchAt=app.indexOf("async function search()",tagsAt);
const novelAt=app.indexOf("async function novel()",searchAt);
assert.ok(genresAt>=0&&tagsAt>genresAt&&searchAt>tagsAt&&novelAt>searchAt,"Genre, tag and search pages must exist.");
const genresPage=app.slice(genresAt,tagsAt),tagsPage=app.slice(tagsAt,searchAt),searchPage=app.slice(searchAt,novelAt);
for(const key of ["Genres","Enter a genre and let the catalog narrow the realm for you.","Tags","Browse story themes and fandom-friendly classifications.","Search","Find novels, authors and alternate titles, then refine the results with catalog filters.","Search the storyverse...","Top Rated","Completed","Fanfiction","Search the Imperial catalog","Enter a title, author or alternate title to begin.","Explore Trending Stories"]) {
  for(const locale of Object.keys(languageDictionary))assert.ok(languageDictionary[locale][key],"Missing discovery page translation for "+key+" in "+locale);
}
assert.ok(genresPage.includes("sub.dataset.inLang=''")&&genresPage.includes("setINLang(document.documentElement.lang||'en')"),"Genre directory heading and description must use the selected language.");
assert.ok(tagsPage.includes("sub.dataset.inLang=''")&&tagsPage.includes("setINLang(document.documentElement.lang||'en')"),"Tag directory heading and description must use the selected language.");
assert.ok(searchPage.includes('data-in-lang-placeholder="Search the storyverse..."'),"Search input placeholder must be localizable.");
assert.ok(searchPage.includes("data-in-lang>Search</button>"),"Search action must be localizable.");
assert.ok(searchPage.includes("setINLang(document.documentElement.lang||'en')"),"Search page must apply the selected language after dynamic rendering.");

console.log("Homepage, catalog, genre/tag directories, search and 14-language reader localization checks passed.");
