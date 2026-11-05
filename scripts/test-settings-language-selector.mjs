import fs from 'node:fs';
import assert from 'node:assert/strict';

const app = fs.readFileSync('public/app.js', 'utf8');
const served = fs.readFileSync('public/app-17.24.0.js', 'utf8');
const html = fs.readFileSync('public/index.html', 'utf8');
const match = app.match(/const SETTINGS_LANG=(\{[\s\S]*?\});/);
assert.ok(match, 'Settings locale dictionary must exist');
const dictionaries = JSON.parse(match[1]);
const locales = ['en','ur','hi','zh-CN','zh-TW','es','fr','id','ja','ko','pt-BR','ar','vi','fa'];
const keys = ['Interface language','Choose the language used across Imperial Novel.','Language preference saved.'];
for (const locale of locales) {
  assert.ok(dictionaries[locale], 'Missing locale: ' + locale);
  for (const key of keys) assert.ok(dictionaries[locale][key], 'Missing ' + locale + ' translation: ' + key);
}
assert.equal(Object.keys(dictionaries).length, 14);
assert.ok(app.includes('id="setLanguage"'), 'Settings language selector missing');
assert.ok(app.includes("$('#setLanguage').value=language"), 'Saved language must be selected on load');
assert.ok(app.includes("$('#setLanguage').addEventListener('change'"), 'Language selector must update interface');
assert.ok(app.includes("setINLang(language);$('#setLanguage').value=language"), 'Language change must use shared localization system');
assert.equal(app, served, 'Served versioned asset must match source app.js');
assert.ok(html.includes('/app-17.24.0.js'));
console.log('Settings language selector passed: 14 locales, native language names, saved preference restore, live language switch and source/served parity.');
