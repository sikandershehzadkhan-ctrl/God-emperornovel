import fs from 'node:fs';
import assert from 'node:assert/strict';

const app = fs.readFileSync('public/app.js', 'utf8');
const served = fs.readFileSync('public/app-17.24.0.js', 'utf8');
const html = fs.readFileSync('public/index.html', 'utf8');
const match = app.match(/const IN_LANG=(\{[\s\S]*?\});/);
assert.ok(match, 'Interface locale dictionary must exist');
const dictionaries = JSON.parse(match[1]);
const locales = ['en','ur','hi','zh-CN','zh-TW','es','fr','id','ja','ko','pt-BR','ar','vi','fa'];
for (const locale of locales) {
  assert.ok(dictionaries[locale]?.['Skip to main content'], 'Missing skip-link translation: ' + locale);
}
assert.ok(app.includes('<a class="skipLink" href="#app" data-in-lang>Skip to main content</a>'), 'Skip navigation link must be exposed to localization');
assert.equal(app, served, 'Served versioned asset must match source app.js');
assert.ok(html.includes('/app-17.24.0.js'));
console.log('Navigation accessibility localization passed: 14 locale labels and synchronized public asset.');
