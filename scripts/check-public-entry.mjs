'use strict';

const fs = require('node:fs');
const path = require('node:path');

const htmlPath = path.join('public', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const appRootCount = (html.match(/\bid=["']app["']/g) || []).length;

if (appRootCount !== 1) {
  console.error(`Expected exactly one #app root in ${htmlPath}, found ${appRootCount}.`);
  process.exit(1);
}

const missing = [];
for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) {
  const raw = match[1];
  if (/^(?:[a-z]+:|\/\/|#)/i.test(raw)) continue;
  const pathname = raw.split(/[?#]/, 1)[0];
  if (!pathname || pathname === '/') continue;
  const localPath = path.join('public', pathname.replace(/^\/+/, ''));
  if (!fs.existsSync(localPath)) missing.push({ raw, localPath });
}

if (missing.length) {
  console.error('Missing local assets referenced by public/index.html:');
  for (const item of missing) console.error(`- ${item.raw} -> ${item.localPath}`);
  process.exit(1);
}

const runtimeRef = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(m => m[1]).find(src => /\.js(?:[?#]|$)/.test(src));
if (!runtimeRef) {
  console.error('No local JavaScript runtime is referenced by public/index.html.');
  process.exit(1);
}

const runtimePath = path.join('public', runtimeRef.split(/[?#]/, 1)[0].replace(/^\/+/, ''));
const runtime = fs.readFileSync(runtimePath, 'utf8');
if (!runtime.includes("document.querySelector('#app')||document.createElement('main')")) {
  console.error('Runtime does not reuse the existing #app root. This can create duplicate app roots and stuck loaders.');
  process.exit(1);
}

console.log(`Entry-point validation passed: ${appRootCount} app root, all local HTML assets exist, runtime ${runtimeRef} reuses the app root.`);
