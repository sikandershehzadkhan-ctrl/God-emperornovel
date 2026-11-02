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
assert.equal(app,shipped,"Served JavaScript must match the source.");

const languageBlock=app.match(/const IN_LANG=(\{[\s\S]*?\});function setINLang/);
assert.ok(languageBlock,"Interface language dictionary must be available.");
const languageDictionary=JSON.parse(languageBlock[1]);
assert.equal(Object.keys(languageDictionary).length,14,"The interface must retain all 14 supported UI languages.");
const readerAt=app.indexOf("async function reader()");
const readerEnd=app.indexOf("\n}\nasync function authPage",readerAt);
assert.ok(readerAt>=0&&readerEnd>readerAt,"Reader implementation must exist.");
const reader=app.slice(readerAt,readerEnd);
for(const key of ["Chapter","← Chapters","Chapter List","Close","Theme","Line spacing","Text width","Compact","Comfort","Relaxed","Focused","Standard","Wide","Keep reading","Next Chapter →","Novel Overview","← Previous","Next →","Unlock Chapter","Open Crown Vault","Chapter locked","Authorized chapter"]) {
  assert.ok(reader.includes('data-in-lang>'+key+'<')||reader.includes('data-in-lang>'+key), "Reader UI must mark "+key+" for translation.");
  for(const locale of Object.keys(languageDictionary))assert.ok(languageDictionary[locale][key], "Missing "+key+" translation for "+locale);
}
assert.ok(app.includes("document.querySelectorAll('[data-in-lang]')"),"Language switching must translate dynamically rendered reader labels.");
assert.ok(reader.includes("setINLang(document.documentElement.lang||'en')"),"Reader must apply the selected language after rendering.");
assert.ok(reader.includes("content.dir=/^(ur|ar|fa|persian|arabic|urdu)$/i.test(String(n.language||''))"),"Chapter text direction must follow the story language, not only the interface language.");


for(const key of ["Sort","Status","Type","Minimum Rating","Apply Filters","Browse Genres","Browse Tags","Advanced Search","Active filters","Clear all","Discover your next world"]) {
  assert.ok(catalog.includes('data-in-lang>'+key+'<')||catalog.includes('data-in-lang>'+key), "Catalog UI must mark "+key+" for translation.");
  for(const locale of Object.keys(languageDictionary))assert.ok(languageDictionary[locale][key], "Missing catalog label "+key+" translation for "+locale);
}
assert.ok(catalog.includes("catalogTitle.dataset.inLang=''"),"Catalog heading must be localized after its page template is rendered.");
assert.ok(catalog.includes("renderFilterChips();setINLang(document.documentElement.lang||'en')"),"Dynamically rendered active filters must be localized.");
assert.ok(catalog.includes("setINLang(document.documentElement.lang||'en');\n }catch(error)"),"Catalog pagination and result state must reapply the selected language.");


for(const key of ["Sort","Status","Type","Minimum Rating","Apply Filters","Browse Genres","Browse Tags","Advanced Search","Active filters","Clear all","Clear","Discover your next world"]) {
  assert.ok(catalog.includes('data-in-lang>'+key+'<')||catalog.includes('data-in-lang>'+key), "Catalog UI must mark "+key+" for translation.");
  for(const locale of Object.keys(languageDictionary))assert.ok(languageDictionary[locale][key], "Missing catalog label "+key+" translation for "+locale);
}
assert.ok(catalog.includes("catalogTitle.dataset.inLang=''"),"Catalog heading must be localized after the page template renders.");
assert.ok(catalog.includes("renderFilterChips();setINLang(document.documentElement.lang||'en')"),"Dynamic active filter chips must apply the selected language.");
assert.ok(catalog.includes("data-in-lang>← Previous")&&catalog.includes("data-in-lang>Next →"),"Catalog pagination labels must be localizable.");

console.log("Catalog discovery, localized catalog controls and 14-language reader interface checks passed.");
