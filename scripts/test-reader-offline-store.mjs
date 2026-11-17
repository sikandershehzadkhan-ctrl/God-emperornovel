import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createOfflineChapterStore, OFFLINE_CHAPTER_LIMIT, OFFLINE_CHAPTER_MAX_BYTES, OFFLINE_TOTAL_MAX_BYTES } from '../public/reader-offline.mjs';

const app=fs.readFileSync('public/app.js','utf8');
const served=fs.readFileSync('public/app-17.23.0.js','utf8');
const worker=fs.readFileSync('public/sw.js','utf8');
const css=fs.readFileSync('public/imperial-design-system.css','utf8');
assert.equal(app,served,'Editable and served browser bundles must remain identical.');
assert.match(app,/import\\('\/reader-offline\\.mjs'\\)/,'Reader must load the offline chapter store.');
assert.match(app,/const saved=await offlineStore\\.get\\(id,num\\)/,'Reader must fall back to locally saved chapters when the API is unavailable.');
assert.match(app,/d\\.unlocked===true/,'Only content currently authorized by the chapter API may be saved.');
assert.match(app,/Save chapter offline/,'Offline downloads must require an explicit user action.');
assert.match(app,/data-offline-remove/,'Users must be able to remove individual offline chapters.');
assert.match(worker,/!key\\.startsWith\\('imperial-novel-offline-chapters-'\\)/,'App updates must preserve the separate user offline-chapter cache.');
assert.match(css,/\\.readerOfflinePanel/,'Offline library must have a responsive reader UI.');

class MemoryCache {
  entries = new Map();
  async keys() { return [...this.entries.keys()].map(url=>new Request('https://imperial.test'+url)); }
  async match(key) { const url=key instanceof Request?new URL(key.url).pathname:new URL(key,'https://imperial.test').pathname;const response=this.entries.get(url);return response?response.clone():undefined; }
  async put(key,response) { const url=key instanceof Request?new URL(key.url).pathname:new URL(key,'https://imperial.test').pathname;this.entries.set(url,response.clone()); }
  async delete(key) { const url=key instanceof Request?new URL(key.url).pathname:new URL(key,'https://imperial.test').pathname;return this.entries.delete(url); }
}
class MemoryCacheStorage {
  cache=new MemoryCache();
  async open() { return this.cache; }
}

const storage=new MemoryCacheStorage();
const store=createOfflineChapterStore(storage);
const novel={id:7,title:'A Rights-Cleared Story',author:'Author',kind:'text'};
const chapter={id:70,chapter_number:3,title:'The Crossing',unlocked:true,content:'<p>Authorized chapter content.</p>'};
assert.equal((await store.save({novel,chapter})).ok,true,'An unlocked chapter should save locally after an explicit request.');
const restored=await store.get(7,3);
assert.equal(restored.chapter.content,chapter.content,'Saved content must be readable offline.');
assert.equal((await store.list()).length,1,'Offline library should list saved chapters.');
assert.equal((await store.save({novel,chapter:{...chapter,chapter_number:4,unlocked:false}})).reason,'not-authorized','Locked content must never be saved.');
assert.equal((await store.save({novel,chapter:{...chapter,chapter_number:4,content:'x'.repeat(OFFLINE_CHAPTER_MAX_BYTES+1)}})).reason,'chapter-too-large','Oversized chapters must be rejected.');
assert.equal(await store.remove(7,3),true,'A user must be able to remove a saved chapter.');
assert.equal(await store.get(7,3),null,'Removed content must no longer be available.');
assert.equal(OFFLINE_CHAPTER_LIMIT,25,'Offline storage must have a bounded chapter count.');
assert.equal(OFFLINE_TOTAL_MAX_BYTES,20*1024*1024,'Offline storage must have a bounded total size.');
console.log('Offline chapter authorization, storage limits, retrieval and removal checks passed.');
