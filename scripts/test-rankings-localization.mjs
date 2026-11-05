import fs from 'node:fs';
import assert from 'node:assert/strict';

const app=fs.readFileSync('public/app.js','utf8');
const served=fs.readFileSync('public/app-17.23.0.js','utf8');
const html=fs.readFileSync('public/index.html','utf8');
const match=app.match(/const RANKING_LANG=(\{[\s\S]*?\});\nfunction setINLang/);
assert.ok(match,'Ranking locale dictionary must be present');
const dictionaries=JSON.parse(match[1]);
const locales=['en','ur','hi','zh-CN','zh-TW','es','fr','id','ja','ko','pt-BR','ar','vi','fa'];
const keys=[
 'Leaderboard','Weekly','Monthly','All Time','Top Novels','Top Authors','Unknown','views','ch.',
 'Open Novel →','No ranked novels yet.','View stories →','Tier List','S Tier','A Tier','B Tier','C Tier',
 'No novels here yet.','novels','Rankings are based on chapter unlocks in the selected period.',
 'Ranked by chapter unlocks in the selected period.',
 'Ranked by chapter unlocks across eligible published stories.','unlocks','No ranked authors yet.',
 'A simple discovery view based on published ratings and activity. It is not an official quality judgment.'
];
for(const locale of locales){assert.ok(dictionaries[locale],'Missing locale: '+locale);for(const key of keys)assert.ok(dictionaries[locale][key],'Missing '+locale+' translation: '+key)}
assert.equal(Object.keys(dictionaries).length,14);
assert.ok(app.includes('function rankingText(key)'), 'Ranking translation helper missing');
assert.ok(app.includes("if(kind==='leaderboard')")&&app.includes("if(kind==='tier-list')"),'Leaderboard and Tier List handlers must remain');
assert.ok(app.includes("rankingText('unlocks')")&&app.includes('data-in-lang>Ranked by chapter unlocks in the selected period.</p>'),'Period chapter-unlock metric must be localized');
assert.ok(app.includes('data-in-lang>Ranked by chapter unlocks across eligible published stories.</p>'),'Author ranking metric must be localized');
assert.ok(app.includes('setINLang(activeLanguage)'), 'Dynamic ranking results must reapply the saved locale');
assert.ok(app.includes('data-in-lang>No ranked novels yet.</div>')&&app.includes('data-in-lang>No ranked authors yet.</div>'),'Leaderboard empty states must be localizable');
assert.ok(app.includes('data-in-lang>No novels here yet.</div>'),'Tier List empty state must be localizable');
assert.ok(app.includes("ratingText(n.rating)")&&app.includes("ratingText(x.rating)"),'Canonical ten-point rating formatter must be retained');
assert.equal(app,served,'Served versioned asset must match source app.js');
assert.ok(html.includes('/app-17.23.0.js'),'Public entry must load the canonical 17.23 bundle');
console.log('Rankings localization passed: 14 locales, period unlock metrics, leaderboard/tier-list dynamic rendering, empty states and source/served parity.');
