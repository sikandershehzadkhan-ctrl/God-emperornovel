import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync('public/app.js','utf8');
const served=fs.readFileSync('public/app-17.23.0.js','utf8');
const worker=fs.readFileSync('public/sw.js','utf8');

assert.equal(app,served,'Editable and served browser bundles must remain identical.');
assert.match(app,/const scheduleProgressUpdate=\(\)=>\{if\(progressFrame\)return;progressFrame=requestAnimationFrame\(/,
  'Reader scroll updates must be coalesced into animation frames.');
assert.match(app,/addEventListener\('scroll',scheduleProgressUpdate,\{passive:true\}\)/,
  'The reader must use a passive scroll listener.');
assert.match(app,/addEventListener\('resize',scheduleProgressUpdate,\{passive:true\}\)/,
  'Progress geometry must refresh when the viewport changes.');
assert.match(app,/addEventListener\('pageshow',scheduleProgressUpdate\)/,
  'Progress must refresh when a reader page returns from the back-forward cache.');

assert.match(worker,/const STATIC_ASSET=\/\\\./,
  'Offline runtime caching must be restricted to static asset file extensions.');
assert.match(worker,/url\.origin!==self\.location\.origin\|\|url\.pathname\.startsWith\('\/api\/'\)/,
  'Cross-origin requests and API responses must never enter the service-worker cache.');
assert.match(worker,/request\.mode==='navigate'[\s\S]*?if\(url\.pathname!=='\/'\)return/,
  'The service worker must not cache chapter or account navigation responses.');
assert.match(worker,/!\/private\|no-store\/i\.test\(cacheControl\)/,
  'Responses marked private or no-store must not be cached.');
assert.match(worker,/cache\.put\(request,response\.clone\(\)\)/,
  'Successful public static assets must be stored for offline fallback.');
assert.match(worker,/const cached=await cache\.match\(request\);[\s\S]*?if\(cached\)return cached/,
  'Previously cached static assets must remain available during network failure.');

console.log('Reader progress scheduling and privacy-safe offline asset cache checks passed.');
