import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = process.cwd();
const read = path => fs.readFileSync(new URL('file://' + root + '/' + path), 'utf8');
const html = read('public/index.html');
const adminHtml = read('public/admin.html');
const css = read('public/imperial-design-system.css');
const imports = [...css.matchAll(/@import\s+url\(["']?([^"')]+)["']?\)\s*;/g)].map(match => match[1]);

assert.equal((html.match(/rel="stylesheet"/g) || []).length, 1,
  'The app shell must expose one canonical stylesheet entry point.');
assert.match(html, /href="\/imperial-design-system\.css"/,
  'The app shell must load the unified design system.');
assert.ok(adminHtml.includes('href="/imperial-design-system.css"'), 'The separate administrator application must load the same design system.');
assert.equal(imports.length, 6, 'All six existing feature stylesheets must remain in the unified cascade.');
for (const url of imports) {
  assert.ok(url.startsWith('/'), 'Stylesheet import must be root-relative: ' + url);
  assert.ok(fs.existsSync(new URL('file://' + root + '/public' + url)),
    'Unified stylesheet references a missing asset: ' + url);
}
for (const token of [
  '--in-paper:', '--in-obsidian:', '--in-purple:', '--in-sapphire:',
  '--in-purple-soft:', '--in-sapphire-soft:', '--in-focus:',
  '--in-color-bg-canvas:', '--in-color-bg-surface:', '--in-color-text-primary:', '--in-action-on-primary:', '--in-space-1:', '--in-space-16:', '--in-font-display:', '--in-leading-reading:', '--in-breakpoint-md:', '.in-button', '.in-button--secondary', '.in-field', '.in-field-label', '.in-card', '.in-badge', '.in-tabs', '.in-table-wrap', '.in-empty', '.in-toast', '.in-reader-prose', '[dir="rtl"]', 'html[dir="rtl"] .menuDrawer', 'html[dir="rtl"] .chapterDrawer', 'html[dir="rtl"] .heroOrbit', 'html[dir="rtl"] .trendFactoryNote', 'inset-inline-start:', 'margin-inline:',
  'html[data-theme="dark"]', 'prefers-reduced-motion: reduce',
  'pointer: coarse', ':focus-visible', '.homePage .hero.imperialArchiveHero', 'grid-template-columns: minmax(0, 1fr)', 'html[data-theme="dark"] .homePage .hero.imperialArchiveHero', '.homePage .nextFeatureTile', '.brandText b', '.mobileNav', '.menuDrawer', '.footerLinks a', 'env(safe-area-inset-bottom)', '@media (max-width: 1080px)', '.adminHero', '.adminNav', '.adminCard', '.adminTable', '.adminForm', '.chapterTools', '#omniRes', '#omni .notice', '.omniImport', '.catalogTop.panel', '.catalogSearch', '.catalogGrid', '.catalogCard:hover', '@media (max-width: 900px)', '@media (max-width: 640px)', '.genreGrid', '.tagGrid', '.tagTile', '#lbNovels', '.rankBadge', '.tierPanel', '.miniGrid', '.novelHero', '.novelCover', '.chapterList', '.readerBar', '.readerArticle', '.readerContent', '.chapterDrawer', '.readerFooterCard', '.accountGrid', '.accountMenu', '.metricGrid', '.settingsGridPro', '.settingsPanel', '.settingRow', '.checkRow', '.authorStudioLayout', '.authorCreateForm', '.authorWorksPanel', '.authorWorkActions', '.authorApplicationPanel', '.comicAuthorBuilder', '.communityGrid', '.commentItem', '.commentReply', '.ratingStars', '.reactReactionList', '#communityDiscussions'
]) assert.ok(css.includes(token), 'Missing required design-system contract: ' + token);
assert.ok(css.indexOf('@import') < css.indexOf(':root'),
  'Feature styles must load before the canonical token overrides.');
const appRuntime = read('public/app.js');
for (const theme of ['light','dark','midnight','sepia','imperial','cosmic']) {
  assert.ok(appRuntime.includes("'" + theme + "'"), 'Reader theme remains available: ' + theme);
}
console.log('Imperial unified design-system checks passed.');
