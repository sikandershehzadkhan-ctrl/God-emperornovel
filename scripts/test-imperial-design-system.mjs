import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = process.cwd();
const read = path => fs.readFileSync(new URL('file://' + root + '/' + path), 'utf8');
const html = read('public/index.html');
const css = read('public/imperial-design-system.css');
const imports = [...css.matchAll(/@import\s+url\(["']?([^"')]+)["']?\)\s*;/g)].map(match => match[1]);

assert.equal((html.match(/rel="stylesheet"/g) || []).length, 1,
  'The app shell must expose one canonical stylesheet entry point.');
assert.match(html, /href="\/imperial-design-system\.css"/,
  'The app shell must load the unified design system.');
assert.equal(imports.length, 6, 'All six existing feature stylesheets must remain in the unified cascade.');
for (const url of imports) {
  assert.ok(url.startsWith('/'), 'Stylesheet import must be root-relative: ' + url);
  assert.ok(fs.existsSync(new URL('file://' + root + '/public' + url)),
    'Unified stylesheet references a missing asset: ' + url);
}
for (const token of [
  '--in-paper:', '--in-obsidian:', '--in-purple:', '--in-sapphire:',
  '--in-purple-soft:', '--in-sapphire-soft:', '--in-focus:',
  'html[data-theme="dark"]', 'prefers-reduced-motion: reduce',
  'pointer: coarse', ':focus-visible', '.homePage .hero.imperialArchiveHero', 'grid-template-columns: minmax(0, 1fr)', 'html[data-theme="dark"] .homePage .hero.imperialArchiveHero', '.homePage .nextFeatureTile', '.brandText b', '.mobileNav', '.menuDrawer', '.footerLinks a', 'env(safe-area-inset-bottom)', '@media (max-width: 1080px)'
]) assert.ok(css.includes(token), 'Missing required design-system contract: ' + token);
assert.ok(css.indexOf('@import') < css.indexOf(':root'),
  'Feature styles must load before the canonical token overrides.');
console.log('Imperial unified design-system checks passed.');
