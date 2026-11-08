import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('public/app.js', 'utf8');
const directionRule = 'document.documentElement.dir=(c==="ur"||c==="ar"||c==="fa")?"rtl":"ltr";';

assert.ok(source.includes(directionRule),
  'Urdu, Arabic, and Persian must set the interface direction to RTL while other locales remain LTR');

console.log('RTL locale direction checks passed for Urdu, Arabic, Persian, and the LTR fallback.');
