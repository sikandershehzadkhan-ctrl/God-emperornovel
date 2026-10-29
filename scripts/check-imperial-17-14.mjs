'use strict';

import fs from 'node:fs';
import path from 'node:path';

const html = fs.readFileSync(path.join('public', 'index.html'), 'utf8');
const manifestPath = path.join('public', 'manifest-17.14.0.webmanifest');
const crestPath = path.join('public', 'imperial-novel-crest-17.14.0.svg');
const cssPath = path.join('public', 'imperial-taste-17.14.0.css');

for (const file of [manifestPath, crestPath, cssPath]) {
  if (!fs.existsSync(file)) {
    console.error(`Missing Imperial Novel 17.14.0 asset: ${file}`);
    process.exit(1);
  }
}

for (const expected of [
  '/imperial-novel-crest-17.14.0.svg',
  '/manifest-17.14.0.webmanifest',
  '/imperial-taste-17.14.0.css'
]) {
  if (!html.includes(expected)) {
    console.error(`Entry point does not reference versioned asset: ${expected}`);
    process.exit(1);
  }
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.name !== 'Imperial Novel' || manifest.version !== '17.14.0') {
  console.error('PWA manifest identity/version mismatch.');
  process.exit(1);
}
if (!manifest.icons?.some(icon => icon.src === '/imperial-novel-crest-17.14.0.svg')) {
  console.error('PWA manifest does not use the versioned Imperial crest.');
  process.exit(1);
}

const css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('prefers-reduced-motion') || !css.includes('max-width: 420px')) {
  console.error('Expected reduced-motion and narrow-mobile refinements are missing.');
  process.exit(1);
}

console.log('Imperial Novel 17.14.0 identity, entry references, PWA manifest, and responsive accessibility checks passed.');
