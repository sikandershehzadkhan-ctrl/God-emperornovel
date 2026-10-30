import fs from 'node:fs';
import assert from 'node:assert/strict';

const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
const source = fs.readFileSync('src/index.js', 'utf8');
const index = fs.readFileSync('public/index.html', 'utf8');
const registryMatch = source.match(/const CONTENT_FORMATS=(\[[\s\S]*?\n\];)/);
assert.ok(registryMatch, 'Server-owned content format registry exists');
const formats = [...registryMatch[1].matchAll(/\{id:"([a-z_]+)",label:"([^"]+)",group:"([a-z]+)"[^}]*\}/g)].map(([, id, label, group]) => ({ id, label, group }));
assert.ok(formats.length >= 12, 'Registry includes a broad set of formats');
assert.equal(new Set(formats.map(x => x.id)).size, formats.length, 'Format IDs are unique');
assert.ok(formats.every(x => x.label.trim() && x.group.trim()), 'Every format has a label and group');
assert.ok(source.includes('if(p==="/api/formats"&&m==="GET")'), 'Public format registry endpoint exists');
const taxonomyHandler = source.slice(source.indexOf('async function communityTaxonomy'), source.indexOf('async function adminTaxonomy'));
assert.ok(taxonomyHandler.includes("if(status!=='approved') return json({error:'Only approved taxonomy entries are public'},403)"), 'Public taxonomy API blocks pending/all/rejected proposal enumeration');
assert.ok(taxonomyHandler.includes('SELECT id,type,name,slug,description,created_at FROM taxonomy_submissions'), 'Public taxonomy API returns only non-sensitive approved fields');
assert.ok(!taxonomyHandler.includes('SELECT * FROM taxonomy_submissions WHERE type=?'), 'Public taxonomy API never returns full submission records');
assert.ok(!taxonomyHandler.includes("detail:String(e&&e.message"), 'Public taxonomy API never leaks internal database error details');
const publicAgentRoute = source.match(/if\(p===\"\/api\/agents\"&&m===\"GET\"\)\{return json\(\(await env\.DB\.prepare\(`([^\x60]+)`\)\.all\(\)\)\.results\)\}/);
assert.ok(publicAgentRoute, 'Public agent directory route exists');
assert.ok(!/\\blast_result\\b/.test(publicAgentRoute[1]), 'Public agent directory never exposes private execution results');
const adminAgentRoute = source.match(/if\(p===\"\/api\/admin\/agents\"&&m===\"GET\"\)\{([\s\S]*?)\}/);
assert.ok(adminAgentRoute && adminAgentRoute[1].includes('admin(u)'), 'Private agent execution details remain behind administrator authorization');

assert.ok(taxonomyHandler.includes("console.error('taxonomy submission write failed',e)"), 'Taxonomy write failures remain available to private server logs');
assert.ok(source.includes('CONTENT_FORMAT_IDS.has(kind)'), 'Publishing validates format IDs');
assert.ok(source.includes('supported_formats:CONTENT_FORMATS.map'), 'Invalid formats return accepted IDs');
assert.ok(source.includes('originHint:') && source.includes('experience:'), 'Format registry documents origin traditions and reader experiences');
for (const path of ['public/app.js', `public/app-${version}.js`]) {
 const app = fs.readFileSync(path, 'utf8');
 assert.ok(app.includes('aria-labelledby="homeFormatTitle"'), path + ' makes format discovery visible from the homepage');
 assert.ok(app.includes('href="/format/original"') && app.includes('href="/format/fanfiction"'), path + ' keeps original novels and fanfiction first-class homepage destinations');
}
const scriptMatch = index.match(/<script src="\/([^"]+\.js)" defer><\/script>/);
assert.ok(scriptMatch && fs.existsSync('public/' + scriptMatch[1]), 'HTML references an existing application bundle');
for (const name of new Set(['app.js', scriptMatch[1]])) {
 const app = fs.readFileSync('public/' + name, 'utf8');
 assert.ok(app.includes('async function formatDirectory()'), name + ' includes format directory');
 assert.ok(app.includes('async function formatLanding(kind)'), name + ' includes format shelves');
 assert.ok(app.includes('Playback is not enabled for this format.'), name + ' avoids implying unconfigured playback');
 assert.ok(app.includes("type!=='imperial_comic_chapter'"), name + ' validates structured comic payloads');
 assert.ok(app.includes('initComicViewer()'), name + ' initializes comic reading modes');
 assert.ok(app.includes('Switch to single-page mode'), name + ' supports single-page comic reading');
 assert.ok(app.includes('id="novelComments"') && app.includes('mountNovelComments(box,id)'), name + ' mounts the discussion composer and thread as a React island');
 assert.ok(!app.includes('id="postComment"') && !app.includes('id="commentsList"'), name + ' no longer contains the duplicate legacy comment controls');
}
for (const asset of [`style-${version}.css`,`app-${version}.css`,`imperial-luxury-${version}.css`,`imperial-formats-${version}.css`,`imperial-comic-reader-${version}.css`,`manifest-${version}.webmanifest`]) {
 assert.ok(index.includes('/'+asset), 'HTML references '+asset);
 assert.ok(fs.existsSync('public/'+asset), asset+' exists');
}

for (const path of ['public/app.js', `public/app-${version}.js`]) {
 const app = fs.readFileSync(path, 'utf8');
 assert.ok(app.includes('async function authorStudio()'), path + ' includes the Creator Suite');
 assert.ok(app.includes("else if(p==='/author')await authorStudio();"), path + ' routes the author workspace');
 assert.ok(app.includes("api('/api/author/novels'"), path + ' loads the signed-in author library');
 assert.ok(app.includes("api('/api/author/chapters'"), path + ' supports chapter draft creation');
 assert.ok(app.includes("rights_status!=='original'&&!payload.rights_evidence"), path + ' checks rights evidence before submitting a non-original work');
 assert.ok(app.includes('aria-live="polite"'), path + ' announces draft status updates accessibly');
 assert.ok(app.includes("api('/api/author/novels/'+Number(f.dataset.id),{method:'PATCH'"), path + ' saves story metadata through the authenticated update endpoint');
 assert.ok(app.includes("$$('.authorAddChapter',list).forEach"), path + ' binds all chapter controls as a collection');
 assert.ok(app.includes("$$('.authorCancelChapter',list).forEach"), path + ' binds all chapter cancel controls as a collection');
 assert.ok(app.includes("$$('.authorChapterForm',list).forEach"), path + ' binds all chapter forms as a collection');
 assert.ok(app.includes("$$('.authorSubmitStory',list).forEach"), path + ' binds all review submission controls as a collection');
 assert.ok(app.includes("$$('.authorEditToggle',list).forEach"), path + ' binds story edit toggles');
 assert.ok(app.includes("$$('.authorCancelEdit',list).forEach"), path + ' binds story edit cancel controls');
 assert.ok(app.includes("$$('.authorEditForm',list).forEach"), path + ' binds editable story forms');
 assert.ok(app.includes("CONTENT_FORMAT_OPTIONS.map"), path + ' populates edit format options from the canonical registry');
 assert.ok(app.includes("api('/api/formats')"), path + ' fetches canonical formats from the server registry');
 assert.ok(app.includes("id=\"storyKind\" name=\"kind\" required>'+CONTENT_FORMAT_OPTIONS.map"), path + ' builds the new-story format selector from the registry');
 assert.ok(app.includes('name="alt_titles"'), path + ' supports alternate titles');
 assert.ok(app.includes('list="imperialLanguageOptions"'), path + ' accepts international language names and endonyms');
 assert.ok(app.includes('Chinese (Simplified)') && app.includes('Chinese (Traditional)') && app.includes('Vietnamese') && app.includes('Persian'), path + ' offers broader multilingual language suggestions');

}
assert.ok(source.includes('if(p==="/api/author/novels"&&m==="POST")'), 'Backend supports creating story drafts');
assert.ok(source.includes('if(p==="/api/author/chapters"&&m==="POST")'), 'Backend supports creating chapter drafts');
assert.ok(source.includes("const kind=String(b.kind??n.kind??'original').trim().toLowerCase();if(!CONTENT_FORMAT_IDS.has(kind))"), 'Backend validates format IDs when editing stories');

assert.ok(source.includes('Rights evidence is required before submitting this work for review.'), 'Backend independently enforces rights evidence');

const manifest = JSON.parse(fs.readFileSync(`public/manifest-${version}.webmanifest`,'utf8'));
assert.equal(manifest.version,version,'PWA manifest version matches release');
const entry = fs.readFileSync('public/index.html','utf8');
const runtime = fs.readFileSync(`public/app-${version}.js`,'utf8');
const editableRuntime = fs.readFileSync('public/app.js','utf8');
assert.equal(editableRuntime, runtime, 'Editable application source must match the active versioned runtime to prevent feature and localization drift');
const sw = fs.readFileSync('public/sw.js','utf8');
const luxuryCss = fs.readFileSync(`public/imperial-luxury-${version}.css`,'utf8');
assert.ok(entry.includes(`/app-${version}.js`), 'Entry point loads the cache-busted application runtime');
assert.ok(entry.includes('property="og:title"') && entry.includes('property="og:description"') && entry.includes('name="twitter:card"'), 'Entry point provides international social-sharing metadata');
assert.ok(entry.includes('https://god-emperornovel.sikandershehzadkhan.workers.dev/imperial-novel-app-icon.svg'), 'Social preview uses the new absolute crest URL');
assert.ok(runtime.includes('/imperial-novel-app-icon.svg'), 'Application shell uses the new app icon asset');
assert.ok(!/imperial-novel-app-icon\.svg\?v=17\.(?:13|15|16|17)\.0/.test(runtime), 'Application shell contains no stale crest cache references');
assert.ok(fs.existsSync('public/imperial-novel-app-icon.svg'), 'Imperial Novel app icon asset exists');
assert.ok(sw.includes("'/imperial-novel-app-icon.svg'"), 'Service worker precaches the new app icon asset');
assert.ok(JSON.parse(fs.readFileSync(`public/manifest-${version}.webmanifest`,'utf8')).icons[0].src==='/imperial-novel-app-icon.svg', 'Installed app manifest uses the new app icon');
assert.ok(sw.includes(`const CACHE='imperial-novel-v${version}'`), 'Service worker cache key matches the release');
assert.ok(sw.includes("key!==CACHE") && sw.includes("caches.delete(key)"), 'Activation clears obsolete Imperial Novel caches');
const coreMatch = sw.match(/const CORE=\[([^\]]+)\]/);
assert.ok(coreMatch, 'Service worker declares a core asset list');
const coreAssets = [...coreMatch[1].matchAll(/'([^']+)'/g)].map(([, asset]) => asset);
for (const asset of coreAssets) {
  const pathname = asset.split(/[?#]/, 1)[0];
  const localPath = pathname === '/' ? 'public/index.html' : 'public/' + pathname.replace(/^\/+/, '');
  assert.ok(fs.existsSync(localPath), 'Service worker precache asset exists: ' + asset);
}

assert.ok(runtime.includes("navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'})"), 'Application registers the cache worker without stale update checks');
assert.ok(luxuryCss.includes(':focus-visible') && luxuryCss.includes('prefers-reduced-motion:reduce') && luxuryCss.includes('forced-colors:active'), 'Design system includes keyboard, reduced-motion, and forced-color accessibility safeguards');
assert.ok(runtime.includes('class="skipLink" href="#app">Skip to main content</a>') && entry.includes('id="app" class="appBootRoot" tabindex="-1"') && luxuryCss.includes('.skipLink:focus-visible'), 'Keyboard users can skip navigation and focus the main content landmark');
assert.ok(runtime.includes('".navlinks a,.menuDrawer a span,.footerLinks a,.mobileNav a"'), 'Shared localization includes the mobile navigation and footer');
assert.ok(runtime.includes('n.nodeType===3&&n.textContent.trim()') && runtime.includes('e.dataset.inLangKey'), 'Language switching preserves mobile navigation icons and original translation keys');
assert.ok(runtime.includes('document.documentElement.dir=(c==="ur"||c==="ar")?"rtl":"ltr"'), 'Arabic and Urdu languages switch the document to right-to-left layout');
assert.ok(runtime.includes('"Switch to light mode"') && runtime.includes('"Switch to dark mode"') && runtime.includes('"Open navigation menu"'), 'Shared accessibility labels are localized');
assert.ok(runtime.includes('"vi"') && runtime.includes('"fa"') && runtime.includes('value="vi">Tiếng Việt') && runtime.includes('value="fa">فارسی'), 'Vietnamese and Persian are selectable interface languages');
assert.ok(runtime.includes('const t={...IN_LANG.en,...(IN_LANG[c]||{})}') && runtime.includes('e.textContent=key;return'), 'Missing translations safely fall back to English instead of retaining a previous language');
assert.ok(runtime.includes("document.body.classList.remove('menu-open');setINLang(document.documentElement.lang||'en')") && runtime.includes("document.body.classList.add('menu-open');setINLang(document.documentElement.lang||'en')"), 'Opening and closing the menu refreshes its localized accessibility label');
assert.ok(runtime.includes("applyImperialTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');setINLang(document.documentElement.lang||'en')"), 'Theme-toggle accessibility label follows the newly selected theme');


const formatCss = fs.readFileSync(`public/imperial-formats-${version}.css`,'utf8');
assert.ok(formatCss.includes('.homeFormatCard:focus-visible') && formatCss.includes('.formatLink:focus-visible'), 'Homepage and directory format links retain a visible keyboard focus state');
assert.ok(formatCss.includes('outline:3px solid #83a9ff!important') && formatCss.includes('outline:2px solid Highlight!important'), 'Format navigation focus remains visible in normal and forced-colors modes');
assert.ok(formatCss.includes('border-color:#83a9ff'), 'Keyboard focus also reinforces the active format link border');
assert.ok(formatCss.includes('var(--in-sapphire,#4f8cff)') && !formatCss.includes('brand-cyan'), 'Format navigation uses the Imperial sapphire accent rather than legacy cyan');
const appCss = fs.readFileSync(`public/app-${version}.css`,'utf8');
assert.ok(appCss.includes('--brand-sapphire:var(--in-sapphire') && appCss.includes('var(--brand-sapphire,#4f8cff)'), 'Shared interaction controls use Imperial sapphire instead of legacy cyan/gold accents');
assert.ok(!appCss.includes('--brand-cyan') && !appCss.includes('#22d3ee'), 'Legacy cyan accent is absent from shared interaction CSS');
assert.ok(appCss.includes('prefers-reduced-motion:reduce'), 'Shared interface styles respect reduced-motion preferences');
assert.ok(appCss.includes('.ratingStar:focus-visible'), 'Rating controls have a visible keyboard focus state');

const luxuryDesign = fs.readFileSync(`public/imperial-luxury-${version}.css`,'utf8');
assert.ok(index.includes('Your storyverse is taking longer than expected.') && index.includes("root.replaceChildren(panel)") && index.includes("window.setTimeout"), 'Boot failure shows a retryable recovery screen instead of an endless loader');

assert.ok(index.includes('<html lang="en" data-theme="light">'), 'New visitors receive a white-first theme before JavaScript runs');
assert.ok(luxuryDesign.includes('--white:#FFFFFF') && luxuryDesign.includes('--black:#0B1215') && luxuryDesign.includes('--purple:#6A0DAD') && luxuryDesign.includes('--blue:#0F52BA'), 'Design tokens use the approved four-color palette');
assert.ok(luxuryDesign.includes('background:#6A0DAD;color:#FFFFFF') && luxuryDesign.includes('background:#0F52BA'), 'Primary and hover actions use purple then sapphire');

assert.ok(luxuryDesign.includes('Final art direction: editorial authority') && luxuryDesign.includes('display:none!important;') && luxuryDesign.includes('background:#0e111c;'), 'Homepage hero uses the restrained editorial art direction without decorative orbit layers');

console.log('Content format checks passed: '+formats.length+' formats, comic viewer modes, versioned assets verified.');
