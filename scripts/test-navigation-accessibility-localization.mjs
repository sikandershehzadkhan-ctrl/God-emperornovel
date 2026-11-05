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
console.log("Navigation accessibility localization passed: 14 skip-link translations, input labels, RTL direction and synchronized public bundle.");
