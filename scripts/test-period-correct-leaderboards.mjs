import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const worker = readFileSync('src/index.js', 'utf8');
const app = readFileSync('public/app.js', 'utf8');
const start = worker.indexOf('if(p==="/api/leaderboard"&&m==="GET"){');
const end = worker.indexOf('if(p==="/api/tier-list"&&m==="GET"){', start);
assert.notEqual(start, -1, 'leaderboard API route must exist');
assert.notEqual(end, -1, 'leaderboard route must end before tier-list route');
const route = worker.slice(start, end);

assert.match(route, /\['weekly','monthly','all'\]\.includes\(requestedPeriod\)/, 'unsupported periods must safely fall back to all-time');
assert.match(route, /rights_status IN \('original','public_domain','licensed','authorized'\)/, 'novel and author rankings must exclude ineligible rights states');
assert.match(route, /uc\.publication_status='published'/, 'novel unlock counts must include published chapters only');
assert.match(route, /u\.unlocked_at>=datetime\('now','-\$\{days\} days'\)/, 'novel unlocks must respect the selected time window');
assert.match(route, /COUNT\(u\.chapter_id\) unlocks/, 'author rankings must be based on unlock events');
assert.match(route, /JOIN chapters c ON c\.novel_id=n\.id AND c\.publication_status='published' JOIN unlocks u/, 'author unlocks must come from published chapters');
assert.match(route, /rankingMetric:'chapter_unlocks'/, 'API must identify the ranking metric');
assert.doesNotMatch(route, /ORDER BY views DESC,rating DESC/, 'author rankings must not silently use lifetime views for period tabs');

assert.match(app, /Ranked by chapter unlocks in the selected period\./, 'novel leaderboard must explain its metric');
assert.match(app, /Ranked by chapter unlocks across their eligible published stories\./, 'author leaderboard must explain its metric');
assert.match(app, /Number\(x\.unlocks\|\|0\)/, 'author cards must show the unlock count');
assert.match(app, /Number\(n\.unlocks\|\|0\)/, 'novel cards must show the unlock count');

console.log('Leaderboard period, rights-eligibility, and metric-label checks passed.');
