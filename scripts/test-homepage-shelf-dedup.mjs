import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('public/app.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const served=fs.readFileSync('public/app-'+pkg.version+'.js','utf8');
assert.equal(source,served,'Editable app source and served runtime must remain identical');
const match=source.match(/function uniqueLatestStories\(trendingRows,latestRows\)\s*\{[\s\S]*?\}/);
assert.ok(match,'Homepage shelf de-duplication helper must exist');
const uniqueLatestStories=vm.runInNewContext(match[0]+'; uniqueLatestStories');
const trending=[{id:1,title:'Trending story'},{id:'2',title:'Second trending'}];
const latest=[{id:1,title:'Duplicate'},{id:3,title:'Fresh update'},{id:'2',title:'Second duplicate'},{id:4,title:'Another update'}];
assert.deepEqual(Array.from(uniqueLatestStories(trending,latest),x=>x.id),[3,4],'Latest shelf must exclude trending IDs while preserving order');
assert.deepEqual(Array.from(uniqueLatestStories([],latest),x=>x.id),[1,3,'2',4],'No trending stories must preserve all latest stories');
assert.deepEqual(Array.from(uniqueLatestStories([{id:1}],[{title:'Missing ID'}]),x=>x.title),['Missing ID'],'Rows without IDs must not be accidentally removed');
assert.ok(source.includes('const distinctLatestRows=uniqueLatestStories(trendRows,latestRows);'),'Homepage must compute a distinct latest shelf');
assert.ok(source.includes("renderHomeStories('#latest',distinctLatestRows"),'Homepage must render the de-duplicated latest shelf');
console.log('Homepage shelf regression passed: cross-shelf de-duplication, stable order, and empty-ID safety.');
