import assert from 'node:assert/strict';
import fs from 'node:fs';
import { applyCanonicalStylesheet } from '../src/html-stylesheet.mjs';

const worker = fs.readFileSync('src/index.js', 'utf8');
assert.ok(worker.includes('import { applyCanonicalStylesheet } from "./html-stylesheet.mjs";'));
assert.ok(worker.includes('text=applyCanonicalStylesheet(text);'));
assert.ok(!worker.includes('const releaseStyles='));
assert.ok(!worker.includes('const missingStyles='));

const routeShells = [
  'index.html', 'catalog.html', 'genres.html', 'tags.html', 'search.html',
  'novel.html', 'read.html', 'library.html', 'offline.html', 'history.html',
  'following.html', 'account.html', 'login.html', 'register.html',
  'admin.html', 'author-public.html', 'omniportal.html', 'requests.html',
  'tickets.html', 'community-taxonomy.html', 'fandom.html'
];

for (const file of routeShells) {
  const source = fs.readFileSync('public/' + file, 'utf8');
  const rendered = applyCanonicalStylesheet(source);
  const links = [...rendered.matchAll(/<link\\b(?=[^>]*\\brel\\s*=\\s*["']stylesheet["'])[^>]*>/gi)].map(match => match[0]);
  assert.equal(links.length, 1, file + ' must render exactly one stylesheet entry point');
  assert.equal(links[0], '<link rel="stylesheet" href="/imperial-design-system.css">', file + ' must use the canonical design system');
  assert.ok(!/href=["']\\/(?:style(?:-[^"']+)?|app(?:-[^"']+)?|imperial-luxury-[^"']+|imperial-formats-[^"']+|imperial-comic-reader-[^"']+)\\.css/i.test(rendered), file + ' must not retain retired stylesheet assets');
}

const alreadyCanonical = '<html><head><link rel="stylesheet" href="/imperial-design-system.css"></head><body></body></html>';
assert.equal((applyCanonicalStylesheet(alreadyCanonical).match(/rel="stylesheet"/g) || []).length, 1);
assert.throws(() => applyCanonicalStylesheet('<html><body>missing head</body></html>'), /closing head/);

assert.ok(worker.includes('"\/offline":"offline.html"'), 'Worker must keep the Offline Library shell route');
assert.ok(worker.includes('const noindex=new Set(["/admin","/account","/login","/register","/library","/offline"'), 'Offline Library must remain noindex');
console.log('Canonical stylesheet renderer contracts passed for all representative HTML shells.');
