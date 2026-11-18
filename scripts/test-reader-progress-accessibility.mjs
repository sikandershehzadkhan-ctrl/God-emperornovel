import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync('public/app.js','utf8');
const served=fs.readFileSync('public/app-17.23.0.js','utf8');
assert.equal(app,served,'Editable and served browser bundles must remain identical.');
assert.match(app,/class="readerProgress" role="progressbar" aria-label="Chapter reading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="\$\{chapterPct\}" aria-valuetext="\$\{chapterPct\}% through chapter"/,
  'The initial progress indicator must expose the actual chapter position, not the chapter index within the novel.');
assert.match(app,/id="progressText">\$\{chapterPct\}% through chapter · \$\{initialNovelProgress\}% through novel/,
  'The visible progress summary must distinguish chapter reading progress from position in the novel.');
assert.match(app,/setAttribute\('aria-valuenow',String\(pct\)\);\$\('\.readerProgress'\)\.setAttribute\('aria-valuetext',\x60\$\{pct\}% through chapter\x60\)/,
  'Assistive technology must receive an updated descriptive progress value while reading.');
assert.match(app,/getScrollProgress\(\{scrollTop:window\.scrollY,scrollHeight:document\.documentElement\.scrollHeight,viewportHeight:window\.innerHeight\}\)/,
  'The live value must continue to use actual scroll progress.');
console.log('Reader progress semantics and accessible value updates passed.');
