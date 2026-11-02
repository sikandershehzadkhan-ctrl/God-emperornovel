import fs from 'node:fs';
import assert from 'node:assert/strict';

const app = fs.readFileSync('public/app.js', 'utf8');
const served = fs.readFileSync('public/app-17.24.0.js', 'utf8');
const html = fs.readFileSync('public/index.html', 'utf8');
const match = app.match(/const RANKING_LANG=(\{[\s\S]*?\});\nfunction setINLang/);
assert.ok(match, 'Ranking locale dictionary must be present');
const dictionaries = JSON.parse(match[1]);
const locales = ['en','ur','hi','zh-CN','zh-TW','es','fr','id','ja','ko','pt-BR','ar','vi','fa'];
const keys = [
'Leaderboard','Story and author activity, with weekly, monthly and all-time views.','Weekly','Monthly','All Time',
'Top Novels','Based on published catalog activity.','Top Authors','Authors with published stories.','Unknown','views','ch.',
'Open Novel →','No ranked novels yet.','View stories →','Tier List',
'A simple discovery view based on published ratings and activity. It is not an official quality judgment.',
'S Tier','A Tier','B Tier','C Tier','No novels here yet.','novels'
];
for (const locale of locales) {
  assert.ok(dictionaries[locale], 'Missing locale: ' + locale);
  for (const key of keys) assert.ok(dictionaries[locale][key], 'Missing ' + locale + ' translation: ' + key);
}
assert.equal(Object.keys(dictionaries).length, 14, 'Unexpected ranking locale count');
assert.ok(app.includes("if(kind==='leaderboard')"), 'Leaderboard page handler missing');
assert.ok(app.includes("if(kind==='tier-list')"), 'Tier List page handler missing');
assert.ok(app.includes('setINLang(activeLanguage)'), 'Dynamic ranking results must reapply saved language');
assert.ok(app.includes('data-in-lang>No ranked novels yet.</div>'), 'Leaderboard empty state must be localized');
assert.ok(app.includes('data-in-lang>No novels here yet.</div>'), 'Tier List empty state must be localized');
assert.equal(app, served, 'Served versioned application asset must match source app.js');
assert.ok(html.includes('/app-17.24.0.js'), 'Public entry must load the versioned application asset');
console.log('Rankings localization passed: 14 locales, 24 strings, leaderboard and tier-list dynamic rendering, empty states, and source/served parity.');
