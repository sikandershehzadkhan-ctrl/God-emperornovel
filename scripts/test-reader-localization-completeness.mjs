import fs from 'node:fs';
import assert from 'node:assert/strict';

const app = fs.readFileSync('public/app.js', 'utf8');
const served = fs.readFileSync('public/app-17.24.0.js', 'utf8');
const html = fs.readFileSync('public/index.html', 'utf8');
const match = app.match(/const IN_LANG=(\{[\s\S]*?\});/);
assert.ok(match, 'Interface locale dictionary must exist');
const dictionaries = JSON.parse(match[1]);
const locales = ['en','ur','hi','zh-CN','zh-TW','es','fr','id','ja','ko','pt-BR','ar','vi','fa'];
const keys = ["This chapter is available through Imperial Novel's authorized unlock system. Unlock it for your account to continue reading.",'Imperial Crowns','You reached the latest published chapter','Continue the story when you are ready.','Check the novel page for updates and related stories.','Bookmark chapter','Reader theme','through chapter','through novel','Next: Chapter'];
for (const locale of locales) {
  assert.ok(dictionaries[locale], 'Missing locale: ' + locale);
  for (const key of keys) assert.ok(dictionaries[locale][key], 'Missing ' + locale + ' translation: ' + key);
}
assert.equal(Object.keys(dictionaries).length, 14);
const start = app.indexOf('async function reader()');
const reader = app.slice(start, app.indexOf('\nasync function ', start + 30));
assert.ok(reader.includes('data-in-lang>This chapter is available'), 'Locked-chapter description must be translatable');
assert.ok(reader.includes('data-in-lang>Imperial Crowns'), 'Unlock currency label must be translatable');
assert.ok(reader.includes("readerText('through chapter')"), 'Dynamic chapter progress must use translated labels');
assert.ok(reader.includes("readerText('through novel')"), 'Dynamic novel progress must use translated labels');
assert.ok(reader.includes("readerText('Next: Chapter')"), 'Dynamic next-chapter title must use translated prefix');
assert.ok(reader.includes("readerText('Reader theme')"), 'Reader theme accessibility label must be translated');
assert.equal(app, served, 'Served versioned asset must match source app.js');
assert.ok(html.includes('/app-17.24.0.js'));
console.log('Reader localization passed: 14 locales, 10 added reader strings, dynamic progress/footer labels and accessibility labels.');
