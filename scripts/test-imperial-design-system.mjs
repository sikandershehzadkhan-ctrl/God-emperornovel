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
assert.equal((adminHtml.match(/rel="stylesheet"/g) || []).length, 1, 'The administrator shell must expose one canonical stylesheet entry point.');
assert.ok(!/<style\b/i.test(adminHtml), 'Administrator page styles must live in the canonical stylesheet, not inline style blocks.');
assert.ok(css.includes('.adminWrap') && css.includes('.adminHero') && css.includes('.adminNav'), 'Administrator dashboard components must be included in the canonical stylesheet.');
assert.ok(css.includes('.adminWrap .adminCard b.big { color: var(--in-ink); }') && css.includes('.adminWrap .adminNav button.active'), 'Administrator cards and navigation must use readable semantic theme colors.');
assert.ok(css.includes('html[data-theme="dark"] .adminWrap .adminHero'), 'Administrator hero surfaces must adapt to dark theme tokens.');
assert.ok(css.includes('html[dir="rtl"] .adminWrap .adminTable th') && css.includes('html[dir="rtl"] .adminWrap .mobileAdmin'), 'Administrator tables and floating navigation must mirror in RTL.');
assert.equal(imports.length, 0, 'The unified design system must not load legacy stylesheets through runtime imports.');
for (const legacyAsset of ['/style-17.23.0.css','/app-17.23.0.css','/imperial-luxury-17.23.0.css','/imperial-formats-17.23.0.css','/imperial-comic-reader-17.23.0.css','/imperial-glass.css']) {
  assert.ok(!html.includes(legacyAsset), 'The app shell must not load a legacy stylesheet directly: ' + legacyAsset);
  assert.ok(!read('public/sw.js').includes("'" + legacyAsset + "'"), 'The service worker must not precache a retired runtime stylesheet: ' + legacyAsset);
}

for (const token of [
  '--in-paper:', '--in-obsidian:', '--in-purple:', '--in-sapphire:',
  '--in-purple-soft:', '--in-sapphire-soft:', '--in-focus:',
  '--in-color-bg-canvas:', '--in-color-bg-surface:', '--in-color-text-primary:', '--in-action-on-primary:', '--gold: var(--in-purple)', '--gold2: var(--in-purple-strong)', '--lime: var(--in-sapphire)', '--cyan: var(--in-sapphire)', '--imperial-cyan: var(--in-sapphire)', '--in-space-1:', '--in-space-16:', '--in-font-display:', '--in-leading-reading:', '--in-breakpoint-md:', '.in-button', '.in-button--secondary', '.in-field', '.in-field-label', '.in-card', '.in-badge', '.in-tabs', '.in-table-wrap', '.in-empty', '.in-toast', '.in-reader-prose', '[dir="rtl"]', 'html[dir="rtl"] .menuDrawer', 'html[dir="rtl"] .chapterDrawer', 'html[dir="rtl"] .heroOrbit', 'html[dir="rtl"] .trendFactoryNote', 'html[dir="rtl"] .hero.imperialArchiveHero:before', 'html[dir="rtl"] .hero.imperialArchiveHero:after', 'inset-inline-start:', 'margin-inline:',
  'html[data-theme="dark"]', 'prefers-reduced-motion: reduce',
  'pointer: coarse', ':focus-visible', '.homePage .hero.imperialArchiveHero', 'grid-template-columns: minmax(0, 1fr)', 'html[data-theme="dark"] .homePage .hero.imperialArchiveHero', '.homePage .nextFeatureTile', '.brandText b', '.mobileNav', '.menuDrawer', '.footerLinks a', 'env(safe-area-inset-bottom)', '@media (max-width: 1080px)', '.adminHero', '.adminNav', '.adminCard', '.adminTable', '.adminForm', '.chapterTools', '#omniRes', '#omni .notice', '.omniImport', '.catalogTop.panel', '.catalogSearch', '.catalogGrid', '.catalogCard:hover', '@media (max-width: 900px)', '@media (max-width: 640px)', '.genreGrid', '.tagGrid', '.tagTile', '#lbNovels', '.rankBadge', '.tierPanel', '.miniGrid', '.novelHero', '.novelCover', '.chapterList', '.readerBar', '.readerArticle', '.readerContent', '.chapterDrawer', '.readerFooterCard', '.accountGrid', '.accountMenu', '.metricGrid', '.settingsGridPro', '.settingsPanel', '.settingRow', '.checkRow', '.authorStudioLayout', '.authorCreateForm', '.authorWorksPanel', '.authorWorkActions', '.authorApplicationPanel', '.comicAuthorBuilder', '.communityGrid', '.commentItem', '.commentReply', '.ratingStars', '.reactReactionList', '#communityDiscussions'
]) assert.ok(css.includes(token), 'Missing required design-system contract: ' + token);
assert.ok(css.indexOf('.mobileNav') < css.indexOf('--in-color-bg-canvas:'),
  'Consolidated feature rules must precede the semantic design-system layer.');
const appRuntime = read('public/app-17.23.0.js');
assert.equal(appRuntime, read('public/app.js'), 'The served runtime and canonical runtime source must remain synchronized.');
assert.ok(appRuntime.includes('document.documentElement.dir=(c==="ur"||c==="ar"||c==="fa")?"rtl":"ltr";'), 'Urdu, Arabic and Persian must set RTL document direction.');
for (const theme of ['light','dark','midnight','sepia','imperial','cosmic']) {
  assert.ok(appRuntime.includes("'" + theme + "'"), 'Reader theme remains available: ' + theme);
}

const hexTokens = name => [...css.matchAll(new RegExp(name + ':\\s*(#[0-9a-fA-F]{6})', 'g'))].map(match => match[1]).slice(-2);
const luminance = hex => {
  const channels = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255)
    .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
};
const contrast = (a,b) => {
  const values = [luminance(a), luminance(b)].sort((x,y) => y-x);
  return (values[0] + .05) / (values[1] + .05);
};
const purple = hexTokens('--in-purple');
const purpleStrong = hexTokens('--in-purple-strong');
const actionForeground = hexTokens('--in-action-on-primary');
assert.equal(purple.length, 2, 'Light and dark primary action colors must both be defined.');
assert.equal(purpleStrong.length, 2, 'Light and dark hover colors must both be defined.');
assert.equal(actionForeground.length, 2, 'Light and dark action foreground colors must both be defined.');
assert.match(css, /\.primary, \.heroSearch button \{\s*background: var\(--in-purple\);\s*border-color: var\(--in-purple\);\s*color: var\(--in-action-on-primary\);/, 'Real application primary actions must use the theme-aware accessible foreground token.');
for (let theme = 0; theme < 2; theme++) {
  assert.ok(contrast(purple[theme], actionForeground[theme]) >= 4.5,
    'Primary action text must meet WCAG AA contrast in theme index ' + theme + '.');
  assert.ok(contrast(purpleStrong[theme], actionForeground[theme]) >= 4.5,
    'Primary action hover text must meet WCAG AA contrast in theme index ' + theme + '.');
}
assert.ok(css.includes('min-height: 44px;'), 'Shared interactive targets must meet the 44px touch target baseline.');
assert.ok(css.includes('outline: 3px solid var(--in-color-focus-ring);'), 'Shared components must expose a visible keyboard focus ring.');
assert.ok(css.includes('@media (prefers-contrast: more)') && css.includes('@media (forced-colors: active)'), 'High-contrast and forced-color modes must be supported.');
assert.ok(css.includes('@media (prefers-reduced-transparency: reduce)'), 'Reduced-transparency mode must provide calmer reading surfaces.');
console.log('Imperial unified design-system checks passed.');


// Route-to-design-system regression contract. These checks tie real boot routes and
// rendered page-family components to the canonical stylesheet, rather than merely
// checking that a selector happens to exist.
const routeRuntime = read('public/app.js');
const routePairs = [
  ["home", "if(p==='/')await home()", ".homePage .hero.imperialArchiveHero"],
  ["catalog and discovery", "else if(p==='/discover'||p==='/catalog')await catalog()", ".catalogTop.panel"],
  ["format directory", "else if(p==='/formats')await formatDirectory()", ".formatDirectoryGrid"],
  ["format landing", "else if(/^\\/format\\/[^/]+\\/?$/.test(p))await formatLanding", ".formatProfile"],
  ["genres", "else if(p==='/genres')await genres()", ".genreGrid"],
  ["tags", "else if(p==='/tags')await tags()", ".tagGrid"],
  ["search", "else if(p==='/search')await search()", ".catalogSearch"],
  ["novel detail", "else if(/^\\/novel\\/\\d+\\/?$/.test(p))await novel()", ".novelHero"],
  ["chapter list", "else if(/^\\/novel\\/\\d+\\/chapters\\/?$/.test(p))await chapters()", ".chapterList"],
  ["reader", "else if(/^\\/read\\/\\d+\\/\\d+\\/?$/.test(p))await reader()", ".readerPage"],
  ["author studio", "else if(p==='/author')await authorStudio()", ".authorStudioLayout"],
  ["community", "else if(p==='/community')await discoveryPage('community')", ".communityGrid"],
  ["account", "else if(p==='/account')await account()", ".accountGrid"],
  ["settings", "else if(p==='/settings')settings()", ".settingsGridPro"],
  ["trend factory", "else if(p==='/trend-factory')await trendFactory()", ".trendFactoryNote"],
  ["omniportal", "else if(p==='/omniportal')await omni()", ".omniImport"]
];
for (const [name, dispatch, selector] of routePairs) {
  assert.ok(routeRuntime.includes(dispatch), 'Boot router must dispatch the ' + name + ' route.');
  assert.ok(css.includes(selector), 'Canonical design system must style the real ' + name + ' page family (' + selector + ').');
}
assert.ok(routeRuntime.includes("else if(p==='/community')await discoveryPage('community')"), 'Community is an explicit routed destination.');
assert.ok(routeRuntime.includes("else if(/^\\/author\\/[^/]+$/.test(p))await authorPublic()"), 'Public creator profiles have a distinct route from the private Author Studio.');
assert.ok(css.includes('@media (max-width: 1080px)') && css.includes('@media (max-width: 900px)') && css.includes('@media (max-width: 640px)'), 'The unified stylesheet must retain desktop, tablet and narrow-mobile responsive breakpoints.');
assert.ok(css.includes('@media (max-width: 420px)') || css.includes('@media (max-width: 430px)') || css.includes('@media (max-width: 480px)'), 'The unified stylesheet must include a compact-phone layout pass.');
assert.ok(css.includes('html[dir="rtl"]') && css.includes('[dir="rtl"]'), 'Route families must inherit direction-aware layout rules.');
assert.ok(routeRuntime.includes('document.documentElement.dir=(c==="ur"||c==="ar"||c==="fa")?"rtl":"ltr";'), 'Language selection must update document direction before route rendering.');
assert.ok(css.includes('scrollbar-width') || css.includes('overflow-x: auto'), 'Narrow screens must retain a usable horizontal-overflow strategy for dense controls.');
assert.ok(css.includes('min-width:0'), 'Grid and flex content must be allowed to shrink without forcing page-wide overflow.');
assert.ok(css.includes('min-height: 44px;'), 'Interactive targets must retain the shared touch-size baseline.');
console.log('Imperial route-family and responsive design contracts passed.');

const mobileTouchFix = css.slice(css.lastIndexOf('/* Touch-target correction:'));
assert.ok(mobileTouchFix.includes('width: 44px;') && mobileTouchFix.includes('min-width: 44px;') && mobileTouchFix.includes('min-height: 44px;'), 'Mobile navigation controls must override legacy 36px sizing with 44px touch targets.');
assert.ok(mobileTouchFix.includes('.mobileAdmin a') && mobileTouchFix.includes('min-height: 44px;'), 'Administrator mobile quick links must meet the 44px touch-target baseline.');

const readerTouchFix = css.slice(css.lastIndexOf('/* Reader accessibility pass:'));
for (const selector of ['.readerTools .readerTool', '.readerActions > button', '.readerPrefs select', '.comicReaderControls button', '.comicPageNav .readerTool']) {
  assert.ok(readerTouchFix.includes(selector), 'Mobile reader accessibility must cover ' + selector + '.');
}
assert.ok(readerTouchFix.includes('flex-wrap: wrap;') && readerTouchFix.includes('.readerBarInner'), 'Reader toolbar must wrap instead of overflowing when its controls reach 44px.');
assert.ok(readerTouchFix.includes('@media (max-width: 390px)'), 'Compact-phone reader layout must receive a dedicated toolbar pass.');
