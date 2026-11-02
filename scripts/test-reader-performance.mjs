import fs from 'node:fs';
import assert from 'node:assert/strict';

const app = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const runtime = fs.readFileSync(new URL('../public/app-17.23.0.js', import.meta.url), 'utf8');
const styles = fs.readFileSync(new URL('../public/app-17.23.0.css', import.meta.url), 'utf8');

assert.equal(runtime, app, 'Editable and versioned browser runtimes must remain synchronized.');
assert.match(app, /let progressFrame=0,lastSavedPct=-1;const updateProgress=\(\)=>\{if\(!d\.unlocked\|\|progressFrame\)return;progressFrame=requestAnimationFrame/, 'Reader progress work must be coalesced to one animation frame.');
assert.match(app, /if\(pct!==lastSavedPct\)\{localStorage\.setItem\('readerProgress:'/,'Reader progress must not write storage repeatedly when the percentage is unchanged.');
assert.match(app, /if\(d\.unlocked&&chapterPct>0\)requestAnimationFrame\(/, 'Restoring reading position must wait for the next rendering frame.');
assert.match(app, /loading=\"\'\+\(i===0\?'eager':'lazy'\)\+'\" decoding=\"async\"/, 'Comic pages after the first must remain lazy-loaded and asynchronously decoded.');
assert.match(styles, /\.comicPage\{content-visibility:auto;contain-intrinsic-size:auto 1000px\}/, 'Off-screen comic pages must defer rendering and reserve layout space.');
console.log('Reader performance checks passed: animation-frame progress, deduplicated storage writes, frame-aligned restoration, lazy comic images, and off-screen rendering containment.');
