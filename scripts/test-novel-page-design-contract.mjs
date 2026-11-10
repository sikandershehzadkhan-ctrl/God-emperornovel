import fs from 'node:fs';
import assert from 'node:assert/strict';
const app=fs.readFileSync('public/app.js','utf8');
const css=fs.readFileSync('public/imperial-ui-primitives.css','utf8');
const novel=app.slice(app.indexOf('async function novel(){'),app.indexOf('async function loadCommunity(id)'));
const chapters=app.slice(app.indexOf('async function chapters(){'),app.indexOf('async function reader(){'));
for(const token of ['in-novel-hero','in-novel-breadcrumb','in-novel-stats','in-novel-taxonomy','in-novel-community-grid','novelRatingIsland','novelReactions','novelComments','libraryBtn','follow','share']) assert.ok(novel.includes(token),`Novel detail missing ${token}`);
for(const token of ['loadCommunity(id)','/api/library','/api/follow','/api/me','/read/']) assert.ok(novel.includes(token),`Novel behavior missing ${token}`);
for(const token of ['in-chapters-header','in-chapters-toolbar','in-chapters-list','chapterRow(ch,id)','batch-unlock','start_chapter:1']) assert.ok(chapters.includes(token),`Chapter directory missing ${token}`);
for(const token of ['.in-novel-hero','.in-novel-community-grid','.in-chapters-header','.in-chapters-list','@media(max-width:48rem)','prefers-reduced-motion']) assert.ok(css.includes(token),`Page-family styling missing ${token}`);
assert.ok(!novel.includes('class="novelHero"'),'Legacy novel hero markup must not remain in the rebuilt page');
assert.ok(!chapters.includes('pageStart(n.title'),'Legacy chapter directory wrapper must not remain');

const reader=app.slice(app.indexOf('async function reader(){'),app.indexOf('async function authPage(mode)'));
for(const token of ['class="in-reader"','readerThemeSelect','readerLineSelect','readerWidthSelect','fontDown','fontUp','bookmarkBtn','chapterDrawer','readerProgressBar','/api/history','/api/bookmark','/api/chapters/']) assert.ok(reader.includes(token),`Reader behavior missing ${token}`);
for(const token of ['.in-reader[data-reader-theme="light"]','.in-reader[data-reader-theme="dark"]','.in-reader[data-reader-theme="midnight"]','.in-reader[data-reader-theme="sepia"]','.in-reader[data-reader-theme="imperial"]','.in-reader[data-reader-theme="cosmic"]','.in-reader .in-reader-content','min-height:44px']) assert.ok(css.includes(token),`Reader design missing ${token}`);

const legacyReaderClasses=[...reader.matchAll(/class="([^"]+)"/g)].some(match=>/\b(readerPage|readerBar|readerBook|readerTool|readerProgress|readerMain|readerMeta|readerArticle|readerContent|readerLock|readerActions|readerFooterCard|readerPrefs|chapterDrawer|readerChapterItem)\b/.test(match[1]));
assert.ok(!legacyReaderClasses,'Legacy reader classes must not remain in reader markup');
console.log('Novel detail, chapter directory and six-theme reader design contracts passed.');


