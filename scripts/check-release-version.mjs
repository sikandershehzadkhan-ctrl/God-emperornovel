'use strict';

import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const wrangler = fs.readFileSync('wrangler.toml', 'utf8');
const manifestPath = `public/manifest-${pkg.version}.webmanifest`;
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const serviceWorker = fs.readFileSync('public/sw.js', 'utf8');
const entry = fs.readFileSync('public/index.html', 'utf8');

assert.ok(wrangler.split('\n').includes(`APP_VERSION = "${pkg.version}"`), 'Cloudflare APP_VERSION must match package.json');
assert.equal(manifest.version, pkg.version, 'PWA manifest version must match package.json');
assert.ok(manifest.start_url.includes(`app=${pkg.version}`), 'PWA start URL must include the current release version');
assert.ok(serviceWorker.includes(`imperial-novel-v${pkg.version}`), 'Service-worker cache key must match package.json');
assert.ok(serviceWorker.includes(`/manifest-${pkg.version}.webmanifest`), 'Service worker must precache the current manifest');
assert.ok(entry.includes(`/manifest-${pkg.version}.webmanifest`), 'HTML entry point must reference the current manifest');
console.log(`Release version consistency passed: ${pkg.version}`);
