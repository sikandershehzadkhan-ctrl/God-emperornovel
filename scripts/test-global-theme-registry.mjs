import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync("public/app.js", "utf8");
const runtime = readFileSync("public/app-17.23.0.js", "utf8");
const css = readFileSync("public/imperial-luxury-17.23.0.css", "utf8");
const themes = ["light", "dark", "midnight", "sepia", "imperial", "cosmic"];
assert.equal(runtime, app, "Source and versioned browser runtime must remain byte-identical");
const html = readFileSync("public/index.html", "utf8");
const baseCssIndex = html.indexOf('href="/style-17.23.0.css"');
const luxuryCssIndex = html.indexOf('href="/imperial-luxury-17.23.0.css"');
assert.ok(baseCssIndex >= 0 && luxuryCssIndex > baseCssIndex, "Canonical semantic theme layer must load after legacy base CSS");

for (const [name, source] of [["source app", app], ["versioned runtime", runtime]]) {
  assert.ok(source.includes("const allowed=['light','dark','midnight','sepia','imperial','cosmic']"), name + " must preserve all six supported site themes");
  for (const theme of themes) assert.ok(source.includes('<option value="' + theme + '" data-in-lang='), name + " settings selector is missing " + theme);
  assert.ok(source.includes("allowed.includes(chosen)?chosen:'light'"), name + " must safely fall back for invalid stored theme values");
}
for (const theme of themes) assert.ok(css.includes('html[data-theme="' + theme + '"]'), "Missing CSS token map for " + theme);
assert.ok(css.includes('html:is([data-theme="dark"],[data-theme="midnight"],[data-theme="imperial"],[data-theme="cosmic"])'), "Dark-family component styles must cover all dark themes");
const settingsStart = app.indexOf("function settings()");
const settingsEnd = app.indexOf("\nasync function boot()", settingsStart);
assert.ok(settingsStart >= 0 && settingsEnd > settingsStart, "Settings route must remain discoverable for preference isolation checks");
const settingsSource = app.slice(settingsStart, settingsEnd);
assert.ok(settingsSource.includes("['imperial_theme',$('#setSiteTheme').value]"), "Site theme must persist only to its global preference key");
assert.ok(settingsSource.includes("['imperial_reader_theme',$('#setReaderTheme').value]"), "Reader theme must persist only to its independent reader preference key");
assert.ok(settingsSource.includes("applyImperialTheme($('#setSiteTheme').value)"), "Settings must apply the global theme from the site selector");
assert.ok(!settingsSource.includes("applyImperialTheme($('#setReaderTheme').value)"), "Reader palette selection must never overwrite the global site theme");
const readerStart = app.indexOf("async function reader()");
const readerEnd = app.indexOf("\nasync function ", readerStart + 1);
assert.ok(readerStart >= 0 && readerEnd > readerStart, "Reader route must remain discoverable for preference isolation checks");
const readerSource = app.slice(readerStart, readerEnd);
assert.ok(readerSource.includes("readerPage.dataset.readerTheme=chosen"), "Reader theme must apply to the reader surface, not the document root");
assert.ok(readerSource.includes("localStorage.getItem('imperial_reader_theme')||'dark'"), "Reader initialization must restore its own stored theme");
assert.ok(readerSource.includes("localStorage.setItem('imperial_reader_theme',chosen)"), "Reader theme changes must persist independently");
assert.ok(!readerSource.includes("document.documentElement.dataset.theme=chosen"), "Reader theme changes must not mutate the global site theme");

const localeMatch = app.match(/const IN_LANG=(\{[\s\S]*?\});function setINLang/);
assert.ok(localeMatch, "Locale dictionary must remain a parseable JSON-compatible map");
const locales = JSON.parse(localeMatch[1]);
const expectedLocales = ["en", "ur", "hi", "zh-CN", "zh-TW", "es", "fr", "id", "ja", "ko", "pt-BR", "ar", "vi", "fa"];
for (const locale of expectedLocales) {
  assert.ok(locales[locale], "Missing supported locale " + locale);
  for (const label of ["Light", "Dark", "Midnight", "Sepia", "Imperial", "Cosmic"]) assert.ok(locales[locale][label], locale + " is missing the " + label + " theme translation");
}
assert.ok(app.includes('document.querySelectorAll("[data-in-lang]")'), "Runtime must translate explicitly marked theme option labels");
assert.ok(app.includes("setINLang(document.documentElement.lang||'en');\n let size="), "Reader theme options must be translated after the reader is rendered");
assert.ok(app.includes("setINLang(document.documentElement.lang||'en');$('#setSiteTheme')"), "Settings theme options must be translated after settings are rendered");

for (const label of ["Light", "Dark", "Midnight", "Sepia", "Imperial", "Cosmic"]) {
  assert.ok(app.includes('data-in-lang="' + label + '"'), "Source app is missing localized theme option " + label);
  assert.ok(runtime.includes('data-in-lang="' + label + '"'), "Versioned runtime is missing localized theme option " + label);
}
console.log("PASS: six global theme identifiers, persistence, CSS maps, and six theme labels in all 14 locales.");
