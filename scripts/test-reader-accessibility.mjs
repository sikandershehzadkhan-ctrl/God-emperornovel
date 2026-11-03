import fs from 'node:fs';
import assert from 'node:assert/strict';

const app = fs.readFileSync('public/app.js', 'utf8');
const served = fs.readFileSync('public/app-17.24.0.js', 'utf8');
const start = app.indexOf('async function reader(){');
assert.ok(start >= 0, 'Reader route must exist');
const reader = app.slice(start, start + 20000);
assert.ok(reader.includes('role="progressbar" aria-label="Chapter progress"'), 'Chapter progress must expose a labeled progressbar');
assert.ok(reader.includes('aria-valuemin="0" aria-valuemax="100" aria-valuenow="${chapterPct}"'), 'Initial progress must expose its numeric range and current value');
assert.ok(reader.includes('aria-valuetext="${chapterPct}% through chapter"'), 'Initial progress must expose a readable value');
assert.ok(reader.includes("setAttribute('aria-valuenow',String(pct))") && reader.includes("setAttribute('aria-valuetext',pct+'% '+readerText('through chapter'))"), 'Progress announcements must track live reader progress');
assert.ok(reader.includes('aria-controls="chapterDrawer"') && reader.includes('aria-labelledby="chapterDrawerTitle"'), 'Chapter menu and drawer must have an accessible relationship');
assert.ok(reader.includes("if(!drawer.hidden)$('#closeChapterMenu').focus()"), 'Opening the drawer must move focus to its close control');
assert.ok(reader.includes("e.key==='Escape'&&!drawer.hidden") && reader.includes('chapterMenuButton.focus()'), 'Escape must close the drawer and restore focus to its trigger');
assert.ok(reader.includes('aria-label="Decrease font size"') && reader.includes('aria-label="Increase font size"'), 'Font controls must have descriptive accessible names');
assert.ok(reader.includes('updateReaderProgressLabel(chapterPct,initialNovelProgress)'), 'Initial progress text must not confuse novel position with chapter completion');
assert.equal(app, served, 'Served reader bundle must match source app.js');
console.log('Reader accessibility passed: progress semantics, live announcements, drawer relationships/focus, Escape handling and font control names.');
