import fs from 'node:fs';
import assert from 'node:assert/strict';

const app=fs.readFileSync('public/app.js','utf8');
const served=fs.readFileSync('public/app-17.23.0.js','utf8');
const html=fs.readFileSync('public/index.html','utf8');
const match=app.match(/const DISCOVERY_LANG=(\{[\s\S]*?\});\nfunction setINLang/);
assert.ok(match,'Community discovery locale dictionary must be present before the canonical resolver');
const dictionaries=JSON.parse(match[1]);
const locales=['en','ur','hi','zh-CN','zh-TW','es','fr','id','ja','ko','pt-BR','ar','vi','fa'];
const keys=[
 'Trending Now','Popular stories and fresh activity across the Imperial catalog.',
 'Discover what readers are exploring now.','Catalog →',
 'One button. One story. Zero browsing indecision.','Ready to discover something unexpected.',
 '🎲 Discover a Random Novel','Your random discovery','No published novels are available yet.',
 'Recommendations based on your library and the public Imperial catalog.','Loading recommendations...',
 'Personalized for your account.','Showing popular catalog stories. Sign in for a more personalized library experience.',
 'No recommendations yet.','Vote on open requests to help the community surface what readers want reviewed.',
 'votes','Vote','Voted ✓','No open novel requests yet.','Submit a request','Notifications',
 'Updates about chapters, follows, requests and your Imperial account.','Mark all as read',
 'No notifications yet.','Made For You'
];
assert.deepEqual(Object.keys(dictionaries).sort(),[...locales].sort(),'Discovery translations must cover all 14 supported locales');
for(const locale of locales){
 assert.ok(dictionaries[locale],'Missing locale: '+locale);
 for(const key of keys) assert.equal(typeof dictionaries[locale][key],'string','Missing '+locale+' translation: '+key);
 for(const key of keys) assert.ok(dictionaries[locale][key].trim(),'Empty '+locale+' translation: '+key);
}
const resolver=app.slice(app.indexOf('function setINLang(c){'),app.indexOf('function ',app.indexOf('function setINLang(c){')+15));
assert.ok(resolver.includes('Object.assign(t,DISCOVERY_LANG[c]||{})'),'Discovery translations must use the shared language resolver');
assert.ok(app.includes('function discoveryText(key){'),'Direct discovery copy must use the selected locale');
const localizerStart=app.indexOf('function localizeDiscoveryPage(root,language){');
const localizerEnd=app.indexOf('\n',localizerStart);
const localizer=app.slice(localizerStart,localizerEnd);
assert.ok(localizer.includes('setINLang(language)'),'Discovery page must apply the selected locale');
assert.ok(!localizer.includes("querySelectorAll('*')"),'Localization must not scan or rewrite creator-authored content');
const start=app.indexOf('async function discoveryPage(kind){');
const end=app.indexOf('\nfunction ',start+20);
const page=app.slice(start,end);
for(const endpoint of ['/api/novels?sort=trending&limit=24','/api/random','/api/made-for-you','/api/vote-novels','/api/notifications','/api/notifications/read']) assert.ok(page.includes(endpoint),'Existing discovery API contract missing: '+endpoint);
for(const marker of ["discoveryText('Trending Now')","discoveryText('Made For You')","discoveryText('Notifications')","data-in-lang>Ready to discover something unexpected.","data-in-lang>Mark all as read"]) assert.ok(page.includes(marker),'Localized discovery UI marker missing: '+marker);
assert.ok(page.includes('esc(n.title)')&&page.includes('esc(x.title)'),'Dynamic story and notification titles must remain escaped and unmodified');
assert.ok((page.match(/localizeDiscoveryPage\(root,activeLanguage\)/g)||[]).length>=5,'Trending, random, recommendations, voting and notifications must reapply localization after rendering');
assert.equal(app,served,'Served versioned application asset must match source app.js');
assert.ok(html.includes('/app-17.23.0.js'),'Public entry must load canonical release 17.23');
console.log('Community discovery localization passed: 14 locales, 25 strings, five discovery flows, existing API contracts, creator-content boundaries and source/served parity.');
