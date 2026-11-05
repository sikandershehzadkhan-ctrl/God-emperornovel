import assert from "node:assert/strict";
import fs from "node:fs";

const app=fs.readFileSync("public/app.js","utf8");
const served=fs.readFileSync("public/app-17.23.0.js","utf8");
const match=app.match(/const IN_LANG=(\{[\s\S]*?\});/);
assert.ok(match,"Interface locale dictionary must exist");
const dictionaries=JSON.parse(match[1]);
const locales=["en","ur","hi","zh-CN","zh-TW","es","fr","id","ja","ko","pt-BR","ar","vi","fa"];
for(const locale of locales)assert.ok(dictionaries[locale]?.["Skip to main content"],"Missing skip-link translation: "+locale);
assert.ok(app.includes('<a class="skipLink" href="#app" data-in-lang>Skip to main content</a>'),"Skip navigation link must be exposed to localization");
assert.ok(app.includes('document.documentElement.dir=(c==="ur"||c==="ar"||c==="fa")?"rtl":"ltr"'),"Urdu, Arabic and Persian must all activate RTL direction");
assert.ok(app.includes('button[aria-label],input[aria-label],nav[aria-label],aside[aria-label]'),"Search inputs must receive localized accessible labels");
assert.equal(app,served,"Versioned 17.23.0 browser bundle must match app.js");

const admin=fs.readFileSync("public/admin.html","utf8");
assert.ok(admin.includes('<a class="adminSkipLink" href="#tabs">Skip to admin sections</a>'),"Admin dashboard must expose a keyboard-visible skip link");
assert.ok(admin.includes('role="tablist" aria-label="Administrator sections"'),"Admin navigation must expose a named tablist");
const adminTabs=[...admin.matchAll(/<button\b[^>]*role="tab"[^>]*>/g)].map(([tag])=>Object.fromEntries([...tag.matchAll(/([:\w-]+)="([^"]*)"/g)].map(([,key,value])=>[key,value])));
const adminPanels=[...admin.matchAll(/<section\b[^>]*role="tabpanel"[^>]*>/g)].map(([tag])=>({...Object.fromEntries([...tag.matchAll(/([:\w-]+)="([^"]*)"/g)].map(([,key,value])=>[key,value])),hidden:/\shidden(?:\s|>)/.test(tag)}));
assert.equal(adminTabs.length,12,"Every admin section must have exactly one tab");
assert.equal(adminPanels.length,12,"Every admin tab must have exactly one panel");
assert.equal(adminTabs.filter(tab=>tab["aria-selected"]==="true").length,1,"Exactly one admin tab must be selected initially");
assert.equal(adminTabs.filter(tab=>tab.tabindex==="0").length,1,"Admin tabs must use roving tabindex");
for(const tab of adminTabs){
 const panel=adminPanels.find(item=>item.id===tab["aria-controls"]);
 assert.ok(panel,"Admin tab must reference an existing panel");
 assert.equal(panel["aria-labelledby"],tab.id,"Admin panel must reference its controlling tab");
 assert.equal(Boolean(panel.hidden),tab["aria-selected"]!=="true","Only the selected admin panel may be exposed");
}
const adminScript=admin.slice(admin.indexOf("<script>"));
for(const key of ["ArrowRight","ArrowLeft","Home","End"])assert.ok(adminScript.includes('event.key==="'+key+'"'),"Admin tab keyboard navigation must support "+key);
assert.ok(adminScript.includes('b.setAttribute("aria-selected",String(selected))'),"Admin tab selection must stay synchronized with aria-selected");
assert.ok(adminScript.includes("b.tabIndex=selected?0:-1"),"Admin tab selection must preserve roving keyboard focus");
assert.ok(adminScript.includes("panel.hidden=!selected"),"Inactive admin panels must be hidden from assistive technology");

console.log("Navigation accessibility localization passed: 14 skip-link translations, input labels, RTL direction and synchronized public bundle.");
