import fs from 'node:fs';
import assert from 'node:assert/strict';

const app=fs.readFileSync('public/app.js','utf8');
const served=fs.readFileSync('public/app-17.23.0.js','utf8');
const html=fs.readFileSync('public/index.html','utf8');
const match=app.match(/const COMMUNITY_LANG=(\{[\s\S]*?\});\nfunction setINLang/);
assert.ok(match,'Community locale dictionary must be present');
const dictionaries=JSON.parse(match[1]);
const locales=['en','ur','hi','zh-CN','zh-TW','es','fr','id','ja','ko','pt-BR','ar','vi','fa'];
const keys=[
 'Community','Discuss stories, discover readers, and help shape the Imperial catalog.',
 'Leaderboard','Explore reader and story activity.','Tier List','Browse S, A, B and C story tiers.',
 'Vote Novels','Support requests the community wants to see.','Random Novel','Let the Imperial library choose.',
 'Trending Stories','Popular stories and fresh activity.','View all','Community discovery','Find your next world',
 'Use personalized recommendations, rankings, requests and voting to explore the catalog.',
 'Made For You →','No published novels yet.','Recent Discussions',
 'Public conversations on published, rights-cleared stories.','Explore stories','Loading recent discussions...',
 'No public discussions yet. Open a story to start a conversation.',
 'Recent discussions are temporarily unavailable.'
];
for(const locale of locales){assert.ok(dictionaries[locale],'Missing locale: '+locale);for(const key of keys)assert.ok(dictionaries[locale][key],'Missing '+locale+' translation: '+key)}
assert.equal(Object.keys(dictionaries).length,14,'Unexpected community locale count');
assert.ok(app.includes('setINLang(activeLanguage);'),'Community page must apply saved language after rendering');
assert.ok(app.includes('data-in-lang>Trending Stories</h2>'),'Trending heading must be marked for localization');
assert.ok(app.includes('data-in-lang>No published novels yet.</div>'),'Empty state must be localized');
assert.ok(app.includes('data-in-lang>Recent Discussions</h2>'),'Recent discussions heading must be marked');
assert.ok(app.includes('communityText(\'No public discussions yet. Open a story to start a conversation.\')'),'Discussion empty state must be translated');
assert.ok(app.includes('esc(x.novel_title)')&&app.includes('esc(x.username)')&&app.includes('esc(String(x.body||\'\').slice(0,220))'),'Creator and community-authored content must remain unchanged');
assert.equal(app,served,'Served versioned application asset must match source app.js');
assert.ok(html.includes('/app-17.23.0.js'),'Public entry must load the canonical 17.23 asset');
console.log('Community localization passed: 14 locales, 24 strings, dynamic page application, discussion empty states and source/served parity.');
