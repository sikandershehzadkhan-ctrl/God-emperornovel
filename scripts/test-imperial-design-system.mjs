import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = process.cwd();
const read = path => fs.readFileSync(new URL('file://' + root + '/' + path), 'utf8');
const html = read('public/index.html');
const adminHtml = read('public/admin.html');
const css = read('public/imperial-design-system.css');
const appJs = read('public/app.js');
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

const tokenFoundationCss = css.split('/* Six-theme semantic layer integrated from the theme-foundation workstream. */')[0];
const hexTokens = name => [...tokenFoundationCss.matchAll(new RegExp(name + ':\\s*(#[0-9a-fA-F]{6})', 'g'))].map(match => match[1]).slice(-2);
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
const globalThemes = ['light','dark','midnight','sepia','imperial','cosmic'];
for (const theme of globalThemes) {
  assert.ok(css.includes('html[data-theme="' + theme + '"]'), 'Unified stylesheet must include the global ' + theme + ' theme map.');
  assert.ok(css.includes('html[data-theme="' + theme + '"][data-high-contrast="true"]'), 'Unified stylesheet must include high-contrast tokens for ' + theme + '.');
  assert.ok(css.includes('html[data-high-contrast="true"] .readerPage[data-reader-theme="' + theme + '"]'), 'Unified stylesheet must include reader high-contrast tokens for ' + theme + '.');
}
assert.ok(css.includes('html:is([data-theme="dark"],[data-theme="midnight"],[data-theme="imperial"],[data-theme="cosmic"])'), 'Dark-family theme component rules must cover every dark theme.');
assert.ok(css.includes('outline: 3px solid var(--in-color-focus-ring);'), 'Shared components must expose a visible keyboard focus ring.');
assert.ok(css.includes('@media (prefers-contrast: more)') && css.includes('@media (forced-colors: active)'), 'High-contrast and forced-color modes must be supported.');
assert.ok(css.includes('@media (prefers-reduced-transparency: reduce)'), 'Reduced-transparency mode must provide calmer reading surfaces.');

const adminMarkup = adminHtml;
const adminStaticMarkup = adminMarkup.split('<script>')[0];
for (const tag of adminStaticMarkup.match(/<[^>]+>/g) || []) {
  const classAttributes = [...tag.matchAll(/\bclass="/g)];
  assert.ok(classAttributes.length <= 1, 'Administrator HTML elements must not contain duplicate class attributes: ' + tag.slice(0, 180));
}
for (const utility of ['admin-mt-10','admin-mt-14','admin-mt-18','admin-chapter-preview','admin-chapter-edit']) {
  const applied = (adminStaticMarkup.match(/<[^>]+>/g) || []).some(tag => {
    const match = tag.match(/class="([^"]*)"/);
    return match && match[1].split(" ").includes(utility);
  });
  assert.ok(applied, 'Administrator markup must actually apply the canonical ' + utility + ' class.');
}
for (const utility of ['admin-mt-10','admin-mt-14','admin-mt-18','admin-chapter-preview','admin-chapter-preview-content','admin-chapter-edit','admin-section-divider']) {
  assert.ok(adminMarkup.includes(utility), 'Administrator markup must use the canonical ' + utility + ' utility.');
  assert.ok(css.includes('.' + utility), 'Canonical CSS must define the ' + utility + ' utility.');
}
assert.ok(!/style="(?:margin-top:|margin:18px|display:none;margin-top:)/.test(adminMarkup),
  'Static administrator layout styles must not remain inline.');
assert.ok(adminMarkup.includes('class="panel admin-chapter-preview" hidden') && adminMarkup.includes('class="panel admin-chapter-edit" hidden'),
  'Chapter preview and edit panels must start hidden semantically and remain styleable.');
assert.ok(adminMarkup.includes("const panel=document.getElementById('chapterPreviewPanel');panel.hidden=false;panel.style.display='block';"), 'Opening chapter preview must clear the native hidden state.');
assert.ok(adminMarkup.includes("function closeChapterPreview(){const panel=document.getElementById('chapterPreviewPanel');panel.hidden=true;panel.style.display='none'}"), 'Closing chapter preview must restore the native hidden state.');
assert.ok(adminMarkup.includes("const panel=document.getElementById('chapterEditPanel');panel.hidden=false;panel.style.display='block';"), 'Opening chapter edit must clear the native hidden state.');
assert.ok(adminMarkup.includes("function cancelChapterEdit(){const panel=document.getElementById('chapterEditPanel');panel.hidden=true;panel.style.display='none';document.getElementById('chapterEditMsg').textContent=''}"), 'Canceling chapter edit must restore the native hidden state.');
assert.ok(css.includes('.admin-chapter-preview[hidden], .admin-chapter-edit[hidden] { display: none !important; }'),
  'The canonical stylesheet must preserve hidden chapter-panel behavior.');
assert.ok(css.includes('.admin-chapter-preview-content { margin-top: 14px; line-height: 1.8; overflow-wrap: anywhere; }'),
  'Chapter preview content must wrap long text without creating horizontal overflow.');


for (const selector of ['.chapterList > .chapter','.chapterList > .chapter:focus-within','.chapterRow > *','.authorWork','.authorStatus.status-draft','.authorCreateForm :where(input,select,textarea):focus-visible','.authorWorkActions > :where(button,a)']) {
  assert.ok(css.includes(selector), 'Real chapter archive and creator workspace styling must cover ' + selector + '.');
}
assert.ok(css.includes('background: var(--in-color-bg-surface);') && css.includes('border-color: var(--in-color-border-subtle);'),
  'Chapter archive rows must use theme-aware surfaces instead of fixed white backgrounds.');
assert.ok(css.includes('@media (max-width: 360px)') && css.includes('.authorWorkActions > :where(button,a) { flex-basis: 100%; }'),
  'Creator actions must stack cleanly on the narrowest supported phone width.');
assert.ok(css.includes('.chapterList > .chapter {') && css.includes('grid-template-columns: minmax(0,1fr);'),
  'Chapter archive entries must become single-column on mobile.');


const creatorWorkflowSelectors = [
  '.authorEditForm', '.authorEditForm[hidden]', '.authorChapterForm',
  '.comicAuthorBuilder', '.comicAuthorBuilder[hidden]', '.comicPageComposerGrid',
  '.comicPageComposerGrid input', '[data-page-list]'
];
for (const selector of creatorWorkflowSelectors) {
  assert.ok(css.includes(selector), 'Creator workflow must have canonical styling for ' + selector + '.');
}
assert.ok(css.includes('.comicPageComposerGrid {') && css.includes('grid-template-columns: minmax(0,1fr);'),
  'Comic page composer must collapse to one column on phones.');
assert.ok(css.includes('.authorEditForm :where(input,select,textarea):focus-visible'),
  'Creator story editing controls must have a visible keyboard focus treatment.');
assert.ok(css.includes('.authorEditForm[hidden], .authorChapterForm[hidden] { display: none !important; }'),
  'Creator edit and chapter forms must preserve their hidden state.');
assert.ok(appJs.includes('data-comic-builder') && appJs.includes('data-page-add') && appJs.includes('data-page-list'),
  'Creator comic authoring UI must be covered by the real route runtime.');


const runtime = read('public/app.js');
const versionedRuntime = read('public/app-17.23.0.js');
assert.equal(runtime, versionedRuntime, 'The unified runtime source and served asset must remain byte-identical.');
assert.ok(runtime.includes("const allowed=['light','dark','midnight','sepia','imperial','cosmic']"), 'Global theme runtime must accept all six site themes.');
assert.ok(runtime.includes("applyImperialTheme($('#setSiteTheme').value)"), 'Settings must apply the selected global theme without collapsing it to light/dark.');
const readerStart = runtime.indexOf("async function reader()");
const readerEnd = runtime.indexOf("\nasync function ", readerStart + 1);
assert.ok(readerStart >= 0 && readerEnd > readerStart, 'Reader route must remain available for theme localization checks.');
const readerSource = runtime.slice(readerStart, readerEnd);
assert.ok(readerSource.includes("setINLang(document.documentElement.lang||'en');"), 'Reader theme options must be localized after reader markup is rendered.');
assert.ok(runtime.includes('document.querySelectorAll("option[data-in-lang]").forEach'), 'Language changes must translate reader theme option labels, not only the global navigation.');
const languageDictionaryStart = runtime.indexOf('const IN_LANG=');
const languageDictionaryEnd = runtime.indexOf(';function setINLang', languageDictionaryStart);
assert.ok(languageDictionaryStart >= 0 && languageDictionaryEnd > languageDictionaryStart, 'The 14-language interface dictionary must remain available.');
const languageDictionary = runtime.slice(languageDictionaryStart, languageDictionaryEnd);
const languageKeys = [...languageDictionary.matchAll(/"([a-z]{2}(?:-[A-Z]{2})?)":/g)];
assert.equal(languageKeys.length, 14, 'All 14 supported interface languages must remain registered.');
for (let index = 0; index < languageKeys.length; index++) {
  const languageCode = languageKeys[index][1];
  const entryStart = languageKeys[index].index;
  const entryEnd = languageKeys[index + 1]?.index ?? languageDictionary.length;
  const languageMap = languageDictionary.slice(entryStart, entryEnd);
  for (const label of ['Light','Dark','Midnight','Sepia','Imperial','Cosmic']) {
    assert.ok(languageMap.includes('"' + label + '":'), 'Reader theme label ' + label + ' must be translated for ' + languageCode + '.');
  }
}

for (const theme of globalThemes) {
  assert.ok(readerSource.includes('<option value="' + theme + '" data-in-lang='), 'Reader theme selector must expose localized ' + theme + ' option.');
}
for (const theme of globalThemes) {
  assert.ok(runtime.includes('<option value="' + theme + '" data-in-lang='), 'Site and reader theme selectors must expose ' + theme + '.');
}
const localeMatch = runtime.match(/const IN_LANG=(\{[\s\S]*?\});function setINLang/);
assert.ok(localeMatch, 'Global theme locale dictionary must remain parseable.');
const locales = JSON.parse(localeMatch[1]);
for (const locale of ['en','ur','hi','zh-CN','zh-TW','es','fr','id','ja','ko','pt-BR','ar','vi','fa']) {
  assert.ok(locales[locale], 'Missing interface locale ' + locale + '.');
  for (const label of ['Light','Dark','Midnight','Sepia','Imperial','Cosmic']) assert.ok(locales[locale][label], locale + ' is missing theme label ' + label + '.');
}
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

assert.ok(css.includes('.adminWrap .scroll {') && css.includes('overscroll-behavior-inline: contain;'),
  'Administrator data tables must scroll inside their own container on narrow screens.');
assert.ok(css.includes('.adminWrap .scroll:focus-visible'),
  'Scrollable administrator tables must expose a keyboard focus indicator.');
assert.ok(css.includes('.adminWrap .adminTable {') && css.includes('min-width: 620px;'),
  'Dense administrator tables must preserve column readability without widening the whole page.');

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

assert.ok(readerTouchFix.includes('min-width: 44px !important;'), 'Reader controls must override earlier legacy min-width !important declarations.');


// RTL logical-property contract for persistent drawers, badges, navigation,
// community replies and directional callouts.
const rtlLogicalPass = read('public/imperial-design-system.css').slice(read('public/imperial-design-system.css').lastIndexOf('/* Logical-direction cleanup:'));
for (const selector of ['html[dir="rtl"] .menuDrawer','html[dir="rtl"] .chapterDrawer','html[dir="rtl"] .statusBadge','html[dir="rtl"] .catalogMeta b','html[dir="rtl"] .menuDrawer .imperialIcon','html[dir="rtl"] .trendFactoryNote','html[dir="rtl"] .legalNotice','html[dir="rtl"] .commentReply']) {
  assert.ok(rtlLogicalPass.includes(selector), 'RTL logical edge mapping must cover ' + selector + '.');
}
for (const property of ['inset-inline-start:', 'inset-inline-end:', 'border-inline-start:', 'border-inline-end:', 'margin-inline-start:', 'margin-inline-end:']) {
  assert.ok(rtlLogicalPass.includes(property), 'RTL logical-direction pass must use ' + property + '.');
}
assert.ok(rtlLogicalPass.includes('@media (max-width: 700px)') && rtlLogicalPass.includes('margin-inline-start: 12px;'), 'Community reply indentation must remain compact on RTL phones.');


// Runtime markup must use canonical classes for static presentation. The sole
// allowed inline style is the reader progress width, which is data-driven.
const runtimeStyleAttributes = [...appJs.matchAll(/\sstyle="([^"]*)"/g)].map(match => match[1]);
assert.equal(runtimeStyleAttributes.length, 1, 'Static runtime presentation must be migrated out of inline style attributes.');
assert.match(runtimeStyleAttributes[0], /^width:\$\{chapterPct\|\|initialNovelProgress\}%$/,
  'The only runtime inline style must be the data-driven reader progress width.');
for (const utility of [
  'in-grid-span-all','in-language-select','in-mt-12','in-mt-18','in-flex-fill',
  'in-reaction-row','in-width-full','in-link-accent','in-card-actions-pad',
  'in-ledger-heading','in-discussion-row','in-comment-copy'
]) {
  assert.ok(appJs.includes(utility), 'Real runtime markup must use the ' + utility + ' utility.');
  assert.ok(css.includes('.' + utility), 'Canonical CSS must define runtime utility ' + utility + '.');
}


// Admin page runtime templates must also stay inside the shared design system.
assert.equal((adminMarkup.match(/\sstyle\s*=/gi) || []).length, 0,
  'Administrator runtime templates must not emit inline style attributes.');
for (const selector of ['.admin-notice-danger','.admin-prewrap','.admin-bio-preview','.admin-sample-preview','.admin-report-status-select','.mini.edit']) {
  assert.ok(css.includes(selector), 'Administrator runtime presentation must be defined in canonical CSS: ' + selector + '.');
}
for (const token of ['admin-notice-danger','admin-prewrap','admin-bio-preview','admin-sample-preview','admin-report-status-select']) {
  assert.ok(adminMarkup.includes(token), 'Administrator runtime markup must use canonical class ' + token + '.');
}

// Route-family implementation audit: confirm creator and reader selectors
// are emitted by real app templates, and admin chapter rows by admin templates.
for (const [label, markup] of [
  ['author work status row', 'class="authorWorkTop"'],
  ['author publication status', 'class="authorStatus status-'],
  ['author work actions', 'class="authorWorkActions"'],
  ['author story edit form', 'class="authorEditForm"'],
  ['comic page composer', 'class="comicPageComposerGrid"'],
  ['comic page list', 'data-page-list'],
  ['chapter archive list', 'class="chapterList"'],
  ['reader toolbar', 'class="readerTools"'],
  ['reader chapter drawer', 'class="chapterDrawer"']
]) {
  assert.ok(appJs.includes(markup), 'Actual application templates must emit ' + label + '.');
}
assert.ok(adminMarkup.includes('<div class="chapterRow">'),
  'Administrator chapter-management rows must be emitted by the actual admin template.');
assert.ok(css.includes('.authorWorkTop{display:flex;') && css.includes('.authorWorkActions{display:flex;'),
  'Author Studio work cards must have explicit layout primitives.');
assert.ok(css.includes('.comicPageComposerGrid {') && css.includes('grid-template-columns: minmax(0,1fr);'),
  'Comic page composer must remain a single-column form on compact screens.');
assert.ok(css.includes('.chapterRow .actions{display:flex;') && css.includes('.chapterList{display:grid;'),
  'Admin chapter rows and public chapter archive must retain structured layouts.');

// Compact viewport contract: 320/360px devices inherit the 360px rules,
// 375/390px devices inherit the 390px reader rules, and all phones inherit
// the 760px touch-target and wrapping rules. These are source contracts,
// not a substitute for screenshot-based browser QA.
const compactPhonePass = read('public/imperial-design-system.css').slice(read('public/imperial-design-system.css').lastIndexOf('/* Touch-target correction:'));
assert.ok(compactPhonePass.includes('@media (max-width: 360px)'),
  '320px and 360px phones must receive the narrow creator-form layout.');
assert.ok(compactPhonePass.includes('@media (max-width: 390px)'),
  '375px and 390px phones must receive the compact reader toolbar layout.');
assert.ok(compactPhonePass.includes('@media (max-width: 760px)') &&
  compactPhonePass.includes('flex-wrap: wrap;') &&
  compactPhonePass.includes('min-height: 44px;'),
  'Phone layouts must wrap reader controls and preserve 44px touch targets.');
assert.ok(compactPhonePass.includes('.readerTools .readerTool { flex: 1 1 44px; }'),
  'Reader toolbar controls must be allowed to share narrow rows without shrinking below the touch baseline.');
assert.ok(compactPhonePass.includes('.authorChapterForm .authorFormGrid { grid-template-columns: minmax(0,1fr); }'),
  'Creator chapter forms must collapse to one column on 320px-class screens.');
const adminTablePass = read('public/imperial-design-system.css').slice(read('public/imperial-design-system.css').lastIndexOf('/* Dense admin datasets'));
assert.ok(adminTablePass.includes('overflow-x: auto;') &&
  adminTablePass.includes('overscroll-behavior-inline: contain;') &&
  adminTablePass.includes('min-width: 620px;'),
  'Dense admin tables must scroll inside their own region rather than widening the page.');
assert.ok(adminTablePass.includes('margin-inline: -2px;'),
  'Admin table scroll gutters must use logical inline margins for RTL parity.');

// Admin chapter and dense-table actions follow the platform's 44px mobile
// interaction baseline while keeping dense tables inside their own scroller.
const adminTouchPass = read('public/imperial-design-system.css').slice(read('public/imperial-design-system.css').lastIndexOf('/* Dense admin datasets'));
assert.ok(adminTouchPass.includes('.adminWrap .adminTable :where(button,select,a) { min-height: 44px; }'),
  'Admin table actions and selectors must meet the 44px touch target baseline.');
assert.ok(read('public/imperial-design-system.css').includes('.chapterRow .actions > :where(button,a) { min-width: 44px; min-height: 44px; }'),
  'Admin chapter-management actions must meet the 44px touch target baseline.');

// Admin form controls use the same 44px touch baseline as reader and creator
// controls. RTL drawer and navigation overrides use logical edge properties.
assert.match(read('public/imperial-design-system.css'), /\.adminWrap \.adminForm :where\(input,select,textarea,button\),\s*\.adminWrap #chapterForm :where\(input,textarea,button\)\s*\{\s*min-height:\s*44px;\s*\}/,
  'Administrator form controls must meet the 44px touch target baseline.');
assert.ok(adminMarkup.includes('class="adminForm"') && adminMarkup.includes('id="chapterForm"'),
  'The admin touch-target rule must correspond to real administrator form markup.');
const rtlLogicalBlock = read('public/imperial-design-system.css').split('/* Logical-direction cleanup: RTL surfaces use writing-mode-aware edges. */').pop().split('/* Runtime layout utilities:')[0];
assert.ok(rtlLogicalBlock.includes('inset-inline-start') &&
  rtlLogicalBlock.includes('border-inline-start') &&
  rtlLogicalBlock.includes('margin-inline-start'),
  'The canonical RTL override layer must use logical positioning and spacing properties.');
assert.ok(!/(^|[;{]\s*)(left|right|margin-left|margin-right|padding-left|padding-right|border-left|border-right)\s*:/m.test(rtlLogicalBlock),
  'The canonical RTL override layer must not reintroduce physical left/right declarations.');

const adminFocusCss = read('public/imperial-design-system.css');
assert.ok(
  adminFocusCss.includes('.adminWrap .adminForm :where(input,select,textarea,button,a):focus-visible') &&
  adminFocusCss.includes('.adminWrap #chapterForm :where(input,textarea,button):focus-visible') &&
  adminFocusCss.includes('.adminWrap .adminTable :where(button,a,select):focus-visible') &&
  adminFocusCss.includes('outline: 3px solid var(--in-color-focus-ring);') &&
  adminFocusCss.includes('outline-offset: 2px;'),
  'Admin forms, chapter controls and table actions must have visible keyboard focus rings.'
);

// Legacy RTL component overrides must be logical too, not merely shadowed by
// a later cleanup layer. Keep drawers, badges, hero artwork and notices mirrored
// with inline-start/end semantics in the source of truth.
const rtlComponentLayer = read('public/imperial-design-system.css')
  .split('/* RTL component overrides use logical edges; physical coordinates are avoided. */')[1]
  .split('/* RTL parity for the current archive hero artwork')[0];
assert.ok(rtlComponentLayer.includes('inset-inline-start') &&
  rtlComponentLayer.includes('inset-inline-end') &&
  rtlComponentLayer.includes('border-inline-start') &&
  rtlComponentLayer.includes('margin-inline-start'),
  'RTL drawers, artwork, notices and component spacing must use logical properties.');
assert.ok(!/(^|[;{]\s*)(left|right|margin-left|margin-right|padding-left|padding-right|border-left|border-right)\s*:/m.test(rtlComponentLayer),
  'The active RTL component override layer must contain no physical left/right declarations.');

const rtlArchiveHeroLayer = read('public/imperial-design-system.css')
  .split('/* RTL parity for the current archive hero artwork')[1]
  .split('/* High-contrast and operating-system forced-color support. */')[0];
assert.ok(rtlArchiveHeroLayer.includes('inset-inline-end: -7%;') &&
  rtlArchiveHeroLayer.includes('inset-inline-end: calc(clamp(250px,38vw,500px)*.43);') &&
  rtlArchiveHeroLayer.includes('inset-inline-end: -95px;'),
  'RTL archive hero artwork must use logical inline-end offsets at desktop and mobile sizes.');
assert.ok(!/(^|[;{]\s*)(left|right)\s*:/m.test(rtlArchiveHeroLayer),
  'RTL archive hero overrides must not use physical left/right offsets.');

