import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('public/index.html','utf8');
const css=fs.readFileSync('public/imperial-homepage-17.24.0.css','utf8');
const app=fs.readFileSync('public/app-17.24.0.js','utf8');
const sw=fs.readFileSync('public/sw.js','utf8');

assert.ok(html.includes('/imperial-homepage-17.24.0.css'),'Homepage stylesheet must be loaded by the production entry point');
assert.ok(sw.includes("'/imperial-homepage-17.24.0.css'"),'Homepage stylesheet must be included in the offline core precache');
assert.ok(app.includes('class="hero nextHero imperialArchiveHero"'),'Homepage must retain its approved Imperial Archive hero');
assert.ok(app.includes('action="/search" method="get" role="search"'),'Hero search must retain its real GET search action');
assert.ok(app.includes('name="q" type="search"'),'Hero search must retain its query field');
assert.ok(css.includes('.hero.imperialArchiveHero{')&&css.includes('grid-template-columns:minmax(0,1fr)'),'Hero must use a single editorial column in every theme');
assert.ok(css.includes('html[data-theme="light"] .hero.imperialArchiveHero'),'Warm light-theme styling must be explicit');
assert.ok(css.includes('html[data-theme="dark"] .hero.imperialArchiveHero'),'Obsidian dark-theme styling must be explicit');
assert.ok(css.includes('min-height:44px'),'Primary search controls must meet the 44px touch-target baseline');
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'),'Hero must honor reduced-motion preferences');
assert.ok(css.includes('@media(forced-colors:active)'),'Hero must preserve forced-colors usability');
assert.ok(!/radial-gradient|linear-gradient|filter:\s*blur/i.test(css),'Hero refinement must not add decorative gradients or blur effects');

console.log('Imperial homepage hero checks passed: one-column layout, production entry/precache, search behavior, themes, touch targets and accessibility.');
