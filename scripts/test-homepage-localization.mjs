import assert from "node:assert/strict";
import fs from "node:fs";

const app=fs.readFileSync("public/app.js","utf8");
const served=fs.readFileSync("public/app-17.23.0.js","utf8");
const match=app.match(/const HOME_LANG=(\{[\s\S]*?\});/);
assert.ok(match,"Homepage locale dictionary must exist");
const dictionaries=JSON.parse(match[1]);
const locales=["en","ur","hi","zh-CN","zh-TW","es","fr","id","ja","ko","pt-BR","ar","vi","fa"];
const keys=["Open a world.","Shape an empire.","Discover stories worth staying up for, then create the worlds only you can imagine.","Search titles, tropes, worlds...","Find your story","Original. Authorized. Reader-first.","Start with the kind of story","you love.","Novels and fanfiction are at the heart of Imperial Novel. Explore other formats whenever you're ready.","All formats","Original novels","Build a world from page one.","Fanfiction","Return to worlds you love.","Light novels","Illustrated, serialized adventures.","Web novels","Follow the next chapter.","Manga & comics","Stories told in panels.","Manhwa & webtoons","Scroll into another world.","Stories with momentum.","Real published stories from the Imperial catalog. No made-up counters, no filler.","Explore all","Read the lore.","Build the universe.","A whole creative ecosystem built around the stories you love and the worlds you want to make.","Meet your Creator Studio","Trend Factory","World Forge","Reader Constellation","OmniPortal","You're not just a reader.","Start with a spark. Build characters, systems, kingdoms, timelines and stories that are yours to tell.","Enter Creator Studio","New chapters. New reasons to stay.","Recently updated stories from the live catalog.","Latest updates","Clear rules. Your reading, your call.","Imperial Crowns and chapter unlocks show their real status. Payments remain pending until manually reviewed.","Imperial Crown Vault"];
for(const locale of locales){assert.ok(dictionaries[locale],"Missing locale: "+locale);for(const key of keys)assert.ok(dictionaries[locale][key],"Missing "+locale+" translation: "+key)}
assert.equal(Object.keys(dictionaries).length,14);
assert.equal(Object.keys(dictionaries.en).length,54);
for(const key of ["THE CURRENT ROTATION","NOT JUST ANOTHER READER","Spot story signals, explore metadata and find creators worth inviting. Rights review stays in control.","Read the signals ↗","Shape your premise, build a story bible and draft chapters in a focused studio.","Build your world ↗","Find your people, trade theories and make a fandom feel alive.","Join the conversation ↗","A rights-first gateway for approved sources, creator attribution and future partnerships.","Explore the portal ↗","YOUR IDEAS DESERVE A WORLD","FRESH FROM THE REALM"])for(const locale of locales)assert.ok(dictionaries[locale][key],"Missing "+locale+" translation: "+key);
assert.ok(app.includes("function applyHomeLanguage(root)"),"Homepage text-node localization helper missing");
assert.ok(app.includes("document.createTreeWalker(root,NodeFilter.SHOW_TEXT)"),"Homepage static text must be localized without replacing semantic markup");
assert.ok(app.includes("new MutationObserver(()=>{if(!root.isConnected)"),"Newly rendered homepage content must be observed without a detached-root leak");
assert.ok(app.includes("applyHomeLanguage(root);"),"Homepage localization must run after either SSR handoff or client rendering");
assert.ok(app.includes("...(HOME_LANG[c]||{})"),"Shared language selector must include homepage translations");
assert.ok(app.includes("if(e.textContent!==value)e.textContent=value"),"Localization must avoid repeated DOM mutations");
assert.ok(app.includes("data-in-lang-placeholder"),"Homepage search placeholder must be localized");
assert.equal(app,served,"Versioned 17.23.0 browser bundle must match app.js");
console.log("Homepage localization passed: 14 locales, 54 core strings, 12 additional section strings, SSR/client text localization and stable dynamic shelf observation.");
