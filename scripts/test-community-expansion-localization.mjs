import fs from 'node:fs';
import assert from 'node:assert/strict';

const app = fs.readFileSync('public/app.js', 'utf8');
const served = fs.readFileSync('public/app-17.24.0.js', 'utf8');
const html = fs.readFileSync('public/index.html', 'utf8');
const match = app.match(/const COMMUNITY_EXPANSION_LANG=(\{[\s\S]*?\});\nfunction discoveryPage/);
assert.ok(match, 'Community expansion locale dictionary must be present');
const dictionaries = JSON.parse(match[1]);
const locales = ['en','ur','hi','zh-CN','zh-TW','es','fr','id','ja','ko','pt-BR','ar','vi','fa'];
const keys = ['Trending Now','Popular stories and fresh activity across the Imperial catalog.','Discover what readers are exploring now.','Catalog →','One button. One story. Zero browsing indecision.','Ready to discover something unexpected.','🎲 Discover a Random Novel','Your random discovery','No published novels are available yet.','Recommendations based on your library and the public Imperial catalog.','Loading recommendations...','Personalized for your account.','Showing popular catalog stories. Sign in for a more personalized library experience.','No recommendations yet.','Vote on open requests to help the community surface what readers want reviewed.','votes','Vote','Voted ✓','No open novel requests yet.','Submit a request','Notifications','Updates about chapters, follows, requests and your Imperial account.','Mark all as read'];
for (const locale of locales) {
  assert.ok(dictionaries[locale], 'Missing locale: ' + locale);
  for (const key of keys) assert.ok(dictionaries[locale][key], 'Missing ' + locale + ' translation: ' + key);
}
assert.equal(Object.keys(dictionaries).length, 14);
assert.ok(app.includes('const localizeDiscovery='), 'Dynamic discovery localization helper missing');
assert.ok(app.includes('new MutationObserver(()=>localizeDiscovery())'), 'Dynamic discovery observer missing');
assert.ok(app.includes("async function authorApplicationPage(user){"), 'Creator application must remain async');
assert.ok(!app.includes('async const AUTHOR_STUDIO_LANG='), 'Invalid async const declaration must not exist');
assert.equal(app, served, 'Served versioned asset must match source app.js');
assert.ok(html.includes('/app-17.24.0.js'));
console.log('Community expansion localization passed: 14 locales, 23 UI strings, dynamic discovery localization and creator application syntax guard.');
