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
assert.ok(app.includes('Promise.allSettled(['),'Homepage story shelves must load independently when one request fails');
assert.ok(app.includes("renderHomeShelfError('#trend'" )&&app.includes("renderHomeShelfError('#latest'"),'Each homepage shelf must expose its own recoverable error state');
assert.ok(app.includes("trendingResult.status==='fulfilled'?uniqueLatestStories(trendRows,latestRows):latestRows"),'Latest stories must remain visible if only the trending request fails');
assert.ok(css.includes('.hero.imperialArchiveHero{')&&css.includes('grid-template-columns:minmax(0,1fr)'),'Hero must use a single editorial column in every theme');
assert.ok(css.includes('html[data-theme="light"] .hero.imperialArchiveHero'),'Warm light-theme styling must be explicit');
assert.ok(css.includes('html[data-theme="dark"] .hero.imperialArchiveHero'),'Obsidian dark-theme styling must be explicit');
assert.ok(css.includes('min-height:44px'),'Primary search controls must meet the 44px touch-target baseline');
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'),'Hero must honor reduced-motion preferences');
assert.ok(css.includes('@media(forced-colors:active)'),'Hero must preserve forced-colors usability');
assert.ok(!/radial-gradient|linear-gradient|filter:\s*blur/i.test(css),'Hero refinement must not add decorative gradients or blur effects');
assert.ok(css.includes('.homePage .homeFormatShelf{')&&css.includes('background:#FDFBF7'),'Format shelf must use the warm-paper editorial surface');
assert.ok(css.includes('html[data-theme="dark"] .homePage .homeFormatShelf'),'Format shelf must define an explicit dark theme');
assert.ok(css.includes('html[data-theme="light"] .homePage .homeFormatShelf'),'Light format shelf must override legacy glass theme selectors');
assert.ok(css.includes('html[data-theme="light"] .homePage .homeStoryGrid .card'),'Light story cards must override legacy glass theme selectors');
assert.ok(css.includes('.homePage .homeStoryGrid .card{')&&css.includes('box-shadow:none'),'Homepage story cards must use quiet, non-glossy surfaces');
assert.ok(css.includes('content:"IN"'),'Format links must use the Imperial Novel monogram rather than decorative glyphs');
assert.ok(css.includes('@media(forced-colors:active)'),'Discovery shelf and story cards must preserve forced-colors usability');

console.log('Imperial homepage checks passed: hero, search, format discovery, story cards, themes, touch targets and accessibility.');
