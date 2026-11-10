import fs from 'node:fs';
import assert from 'node:assert/strict';

const app = fs.readFileSync('public/app.js', 'utf8');
const served = fs.readFileSync('public/app-17.23.0.js', 'utf8');
const html = fs.readFileSync('public/index.html', 'utf8');
const match = app.match(/const PROFILE_LANG=(\{[\s\S]*?\});\nconst DISCOVERY_LANG/);
assert.ok(match, 'Reader profile locale dictionary must be present');
const dictionaries = JSON.parse(match[1]);
const locales = ['en','ur','hi','zh-CN','zh-TW','es','fr','id','ja','ko','pt-BR','ar','vi','fa'];
const keys = ['Your Account','Sign in to access your library, Imperial Crowns and requests.','Account','Your personal Imperial command room.','Profile','Library','History','Following','Imperial Crown Vault','Requests','OmniPortal','Sign out','Imperial Crowns','Unlocks','Recommendations','Sign In','Create Account','Your reader profile'];
for (const locale of locales) {
  assert.ok(dictionaries[locale], 'Missing locale: ' + locale);
  for (const key of keys) assert.ok(dictionaries[locale][key], 'Missing ' + locale + ' translation: ' + key);
}
assert.equal(Object.keys(dictionaries).length, 14, 'Unexpected reader profile locale count');
assert.ok(app.includes('async function account(){'), 'Canonical account handler missing');
assert.ok(app.includes('...(PROFILE_LANG[c]||{})'), 'Reader profile dictionary must join canonical language resolver');
assert.ok(app.includes('const applyAccountLanguage='), 'Account localization adapter missing');
assert.ok(app.includes("navigation.setAttribute('aria-label','Your reader profile')"), 'Reader profile navigation landmark missing');
assert.equal((app.match(/applyAccountLanguage\(\);/g)||[]).length, 2, 'Signed-in and signed-out account states must both apply localization');
for (const endpoint of ['/api/profile','/api/auth/logout','/api/recommendations']) assert.ok(app.includes(endpoint), 'Existing account API contract missing: '+endpoint);
assert.equal(app, served, 'Served versioned application asset must match source app.js');
assert.ok(html.includes('/app-17.23.0.js'), 'Public entry must load the canonical versioned application asset');
console.log('Reader profile localization passed: 14 locales, 18 strings, canonical account API preservation, signed-in/out localization and source/served parity.');
