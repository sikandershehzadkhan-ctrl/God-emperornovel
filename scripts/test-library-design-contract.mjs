import fs from 'node:fs';
import assert from 'node:assert/strict';
const app=fs.readFileSync('public/app.js','utf8');
const css=fs.readFileSync('public/imperial-ui-primitives.css','utf8');
const library=app.slice(app.indexOf("async function library("),app.indexOf("async function history()"));
for(const token of ['in-library-header','in-library-tabs','in-library-continue','in-library-stories','in-library-bookmarks','/api/library','/api/history','/api/bookmarks','/api/follows','visibleItems=active===\'following\'?following:items','novelId=Number(x.novel_id||x.id)','removeLibrary','removeFollowing','/api/follow','ratingText(x.rating)']) assert.ok(library.includes(token),`Library behavior missing ${token}`);
for(const token of ['.in-library-header','.in-library-tabs','.in-library-story','.in-library-bookmark','@media(max-width:48rem)']) assert.ok(css.includes(token),`Library styling missing ${token}`);
assert.ok(!library.includes('pageStart('),'Legacy page wrapper must not remain in library views');
assert.ok(!library.includes('toFixed(1)'),'Do not render invented decimal rating precision');

const history=app.slice(app.indexOf('async function history()'),app.indexOf('async function following()'));
for(const token of ['in-history-header','in-history-list','/api/history','novelId=Number(n.novel_id||n.id)','/read/']) assert.ok(history.includes(token),`History behavior missing ${token}`);
for(const token of ['.in-history-header','.in-history-row','@media(max-width:40rem)']) assert.ok(css.includes(token),`History styling missing ${token}`);
assert.ok(!history.includes('pageStart('),'Legacy page wrapper must not remain in history');
console.log('Library, following and reading history design contracts passed.');

