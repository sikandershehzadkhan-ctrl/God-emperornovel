'use strict';

import fs from 'node:fs';

const app = fs.readFileSync('public/app.js', 'utf8');
const styles = fs.readFileSync('public/app-17.23.0.css', 'utf8');
const destinations = ['/', '/catalog', '/library', '/author', '/community', '/account'];
const marker = 'aria-current="' + '${active(';
const missing = destinations.filter(path => !app.includes('href="' + path + '" ' + marker));
if (missing.length) {
  console.error('Mobile navigation links are missing dynamic aria-current state:', missing.join(', '));
  process.exit(1);
}
if (!/\.mobileNav a\s*\{[^}]*min-height:\s*44px/s.test(styles)) {
  console.error('Mobile navigation links must retain a minimum 44px touch target.');
  process.exit(1);
}
if (!/\.mobileNav a:focus-visible\s*\{[^}]*outline:\s*3px/s.test(styles)) {
  console.error('Mobile navigation links need a clearly visible keyboard focus indicator.');
  process.exit(1);
}
console.log('Mobile navigation accessibility checks passed: six current-page states, 44px touch targets, and visible keyboard focus.');
