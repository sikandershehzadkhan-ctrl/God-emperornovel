'use strict';

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const wrangler = fs.readFileSync('wrangler.toml', 'utf8');
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const manifestPath = `public/manifest-${pkg.version}.webmanifest`;
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const serviceWorker = fs.readFileSync('public/sw.js', 'utf8');
const entry = fs.readFileSync('public/index.html', 'utf8');
const worker = fs.readFileSync('src/index.js', 'utf8');

assert.equal(lock.version, pkg.version, 'Lockfile root version must match package.json');
assert.equal(lock.packages?.['']?.version, pkg.version, 'Lockfile package version must match package.json');
assert.ok(wrangler.split('\n').includes(`APP_VERSION = "${pkg.version}"`), 'Cloudflare APP_VERSION must match package.json');
assert.equal(manifest.version, pkg.version, 'PWA manifest version must match package.json');
assert.ok(manifest.start_url.includes(`app=${pkg.version}`), 'PWA start URL must include the current release version');
assert.ok(serviceWorker.includes(`imperial-novel-v${pkg.version}`), 'Service-worker cache key must match package.json');
assert.ok(serviceWorker.includes(`/manifest-${pkg.version}.webmanifest`), 'Service worker must precache the current manifest');
assert.ok(entry.includes(`/manifest-${pkg.version}.webmanifest`), 'HTML entry point must reference the current manifest');

const coreMatch = serviceWorker.match(/const CORE=\[(.*?)\];/s);
assert.ok(coreMatch, 'Service worker must declare a static CORE precache list');
const coreAssets = [...coreMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map(match => match[1]);
assert.ok(coreAssets.length > 0, 'Service worker precache list must not be empty');
for (const asset of coreAssets) {
  const relative = asset === '/' ? 'public/index.html' : path.join('public', asset.replace(/^\/+/, ''));
  assert.ok(fs.existsSync(relative), `Service-worker precache asset is missing: ${asset}`);
}
for (const asset of coreAssets.filter(asset => /\.(?:css|js)$/.test(asset))) {
  assert.ok(entry.includes(asset), `Versioned CSS/JS asset is not referenced by the HTML entry point: ${asset}`);
}
for (const icon of manifest.icons || []) {
  const url = new URL(icon.src, 'https://imperial-novel.invalid');
  if (url.origin === 'https://imperial-novel.invalid') {
    const relative = path.join('public', url.pathname.replace(/^\/+/, ''));
    assert.ok(fs.existsSync(relative), `PWA manifest icon is missing: ${icon.src}`);
  }
}
assert.ok(worker.includes('const version=String(env.APP_VERSION||"").trim()'), 'HTML rendering derives versioned asset URLs from the active Worker release');
assert.ok(worker.includes('env.APP_ICON_PATH'), 'HTML rendering uses the configured same-origin crest path');
assert.ok(wrangler.includes('APP_ICON_PATH = "/imperial-novel-crest-17.18.0.svg"'), 'Cloudflare config declares the versioned crest asset');
assert.ok(!worker.includes('style-17.11.0.css') && !worker.includes('app-17.13.0.js') && !worker.includes('manifest-17.13.0.webmanifest'), 'HTML rendering has no stale hardcoded frontend release URLs');
assert.ok(worker.includes('"/author":"index.html"'), 'Author Studio uses the unified branded application shell');
assert.ok(worker.includes('"/formats":"index.html"') && worker.includes('else if(/^\\/format\\/[^/]+\\/?$/.test(p))file="index.html"'), 'Format directory and shelves are routed through the branded shell');

console.log(`Release and precache consistency passed: ${pkg.version}; ${coreAssets.length} assets verified.`);
