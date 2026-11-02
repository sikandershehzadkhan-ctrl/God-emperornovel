import fs from 'node:fs';
import assert from 'node:assert/strict';

const app = fs.readFileSync('public/app.js', 'utf8');
const served = fs.readFileSync('public/app-17.24.0.js', 'utf8');
const html = fs.readFileSync('public/index.html', 'utf8');
const match = app.match(/const SETTINGS_LANG=(\{[\s\S]*?\});\nfunction settings/);
assert.ok(match, 'Settings locale dictionary must be present');
const dictionaries = JSON.parse(match[1]);
const locales = ['en','ur','hi','zh-CN','zh-TW','es','fr','id','ja','ko','pt-BR','ar','vi','fa'];
const keys = ['Settings','Make Imperial Novel yours. Preferences are saved on this device.','Appearance & Reading','Site theme','Reader theme','ACCESSIBILITY','Comfort & Control','Reduce motion','High contrast','DATA & PORTABILITY','Export preferences','Reset preferences','Clear local reading data','ACCOUNT & COMMUNITY','Your Imperial account','Account center'];
for (const locale of locales) {
  assert.ok(dictionaries[locale], 'Missing locale: ' + locale);
  for (const key of keys) assert.ok(dictionaries[locale][key], 'Missing ' + locale + ' translation: ' + key);
}
assert.equal(Object.keys(dictionaries).length, 14, 'Unexpected settings locale count');
assert.ok(app.includes('function settings()'), 'Settings page handler missing');
assert.ok(app.includes("setINLang(language);$('#setSiteTheme').value"), 'Settings page must apply saved language after rendering');
assert.ok(app.includes("el.dataset.inLang=''"), 'Settings static labels must be marked for localization');
assert.equal(app, served, 'Served versioned application asset must match source app.js');
assert.ok(html.includes('/app-17.24.0.js'), 'Public entry must load the versioned application asset');
console.log('Account settings localization passed: 14 locales, 16 core labels, saved-language application and source/served parity.');
