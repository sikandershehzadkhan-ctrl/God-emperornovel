import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [html,app,sourceApp,css,worker]=await Promise.all([
 readFile(new URL("../public/index.html",import.meta.url),"utf8"),
 readFile(new URL("../public/app-17.23.0.js",import.meta.url),"utf8"),
 readFile(new URL("../public/app.js",import.meta.url),"utf8"),
 readFile(new URL("../public/imperial-design-foundation.css",import.meta.url),"utf8"),
 readFile(new URL("../src/index.js",import.meta.url),"utf8")
]);
assert.equal(app,sourceApp,"Served homepage bundle must remain byte-for-byte synchronized with the editable source.");
assert.ok(html.includes("/app-17.23.0.js"),"HTML must load the refreshed client bundle");
assert.equal(html.split("/app-17.23.0.js").length-1,1,"HTML must reference the current versioned client bundle exactly once");
assert.ok(app.includes("id=\"homeConnections\""),"Homepage must expose the connected discovery region");
assert.ok(app.includes("imperialHeroVisual")&&app.includes("/imperial-novel-app-icon.svg"),"Homepage hero must feature the approved Imperial black-sun and empty-throne crest.");
assert.ok(app.includes("A NEW ERA OF STORYTELLING")&&app.includes("THE IMPERIAL CREST"),"Homepage hero must establish a distinct editorial identity.");
assert.ok(app.includes('c=Object.prototype.hasOwnProperty.call(IN_LANG,c)?c:"en"'),"Unsupported stored locale values must safely fall back to English.");
assert.ok(app.includes('(c==="ur"||c==="ar"||c==="fa")?"rtl":"ltr"'),"Urdu, Arabic, and Persian must use right-to-left document direction.");
assert.ok(app.includes('[data-in-lang-key]'),"Explicitly marked homepage text nodes must participate in live locale switching.");
assert.ok(app.includes('[data-in-lang-placeholder]'),"Search placeholders must update when the interface language changes.");
assert.ok(homepageLoader.includes('setINLang(document.documentElement.lang||"en");'),"Saved locale must be applied after homepage markup is inserted into the document.");
assert.ok(app.includes('data-in-lang-key="Open a world."')&&app.includes('data-in-lang-key="Shape an empire."'),"The homepage hero headline must expose translation-safe text spans.");
assert.ok(app.includes('document.querySelectorAll(".navlinks a,.menuDrawer a span,.footerLinks a,.mobileNav a,[data-in-lang-key]")'),"Navigation drawer labels must be included in the language refresh pass.");

const localeMatch=app.match(/const IN_LANG=(\{[\s\S]*?\});function setINLang/);
assert.ok(localeMatch,"The language dictionary must remain a single parseable object.");
const localeDictionary=JSON.parse(localeMatch[1]);
for(const code of ["ur","hi","ar","fa"])assert.ok(["Explore the realm","Discover novels","Trend Factory","Genres","Browse formats","My library","Become an Author","Author Studio","Imperial Crown Vault","OmniPortal","Account"].every(label=>localeDictionary[code]?.[label]),code+" must translate the navigation drawer vocabulary in its own locale dictionary.");
assert.equal(Object.keys(localeDictionary).length,14,"The existing fourteen interface locales must be retained.");
for(const code of ["ur","hi","ar","fa"])assert.ok(localeDictionary[code]?.["Open a world."]&&localeDictionary[code]?.["Shape an empire."]&&localeDictionary[code]?.["Find your story"],code+" homepage hero copy must be inside its own locale dictionary.");
for(const code of ["ur","hi","ar","fa"])assert.ok(localeDictionary[code]?.["Follow the threads between worlds."]&&localeDictionary[code]?.["The realm, right now."],code+" discovery and platform sections must be translated.");

for(const code of ["ur","hi","ar","fa"])assert.ok(localeDictionary[code]?.["Follow the threads between worlds."],"Every supported RTL/South Asian homepage locale must contain discovery translations.");
assert.ok(localeDictionary.ur?.["The realm, right now."]&&localeDictionary.hi?.["The realm, right now."]&&localeDictionary.ar?.["The realm, right now."]&&localeDictionary.fa?.["The realm, right now."],"Platform activity headings must be translated in all four extended locales.");

assert.ok(app.includes('"Follow the threads between worlds.":"دنیاؤں کے درمیان رشتے تلاش کریں۔"'),"Urdu discovery headings must be translated within the Urdu dictionary.");
assert.ok(app.includes('"Follow the threads between worlds.":"दुनियाओं के बीच के सूत्र खोजें।"'),"Hindi discovery headings must be translated within the Hindi dictionary.");
assert.ok(app.includes('"Follow the threads between worlds.":"تتبّع الروابط بين العوالم."'),"Arabic discovery headings must be translated within the Arabic dictionary.");
assert.ok(app.includes('"Follow the threads between worlds.":"رشته‌های پیوند میان دنیاها را دنبال کنید."'),"Persian discovery headings must be translated within the Persian dictionary.");
assert.ok(app.includes('data-in-lang-key="Follow the threads between worlds."')&&app.includes('data-in-lang-key="Stories with momentum."'),"Discovery and trending headings must participate in live locale switching.");
assert.ok(app.includes('data-in-lang-key="The realm, right now."')&&app.includes('data-in-lang-key="Latest chapter updates"'),"Platform activity headings must participate in live locale switching.");
assert.ok(app.includes('homeConnectionType" data-home-dynamic-key="')&&app.includes("node.type===\'genre\'?\'Genre\':\'Theme\'"),"Dynamic discovery genre and theme labels must be locale-aware.");
assert.ok(app.includes('document.addEventListener("imperial:languagechange",localizeDiscovery)'),"Dynamic discovery chips must refresh when the selected language changes.");
assert.ok(app.includes('data-home-dynamic-key="The catalog is still building its discovery map.'),"Discovery empty state must be locale-aware.");
assert.ok(app.includes('data-home-dynamic-key="Connected discovery is temporarily unavailable."'),"Discovery error state must be locale-aware.");
const platformLabels=["Published novels","Published chapters","Credited authors","Novel views · all-time","Chapter views · all-time","Signed-in readers · 24h","Chapter updates · 24h","Visible comments","New comments · 24h","Comment likes","Novel reactions","Reader ratings","Bookmarks","Novel follows","No published chapter updates are recorded yet.","No chapter unlock activity in the last seven days yet.","unlocks"];
for(const code of ["ur","hi","ar","fa"])assert.ok(platformLabels.every(label=>localeDictionary[code]?.[label]),code+" must translate platform metric labels and activity states.");
assert.ok(app.includes('data-in-lang-key="'+label+'"'),"Live platform metric labels must expose translation keys when rendered.");
assert.ok(app.includes('setINLang(document.documentElement.lang||\'en\')'),"Live platform data must apply the current locale after asynchronous rendering.");

for(const code of ["ur","hi","ar","fa"])assert.ok(localeDictionary[code]?.["Unknown author"]&&localeDictionary[code]?.["chapters"],code+" must translate dynamic story-card metadata.");
for(const code of ["ur","hi","ar","fa"])assert.ok(localeDictionary[code]?.["The catalog is growing. Be among the first to discover what comes next."]&&localeDictionary[code]?.["No additional recently updated stories yet. Explore the catalog for another world."],code+" must translate story-shelf empty states.");
assert.ok(app.includes('data-in-lang-key="chapters"')&&app.includes('data-in-lang-key="Unknown author"'),"Dynamic story-card metadata must expose translation keys.");
assert.ok(app.includes('setINLang(document.documentElement.lang||"en")'),"Rendered story shelves must apply the currently selected locale after asynchronous insertion.");

const homeCss=css;
assert.ok(homeCss.includes(".homePage .nextFeatureDeck{grid-template-columns:minmax(0,1fr)"),"Localized feature tiles must stack cleanly on mobile.");
assert.ok(homeCss.includes("overflow-wrap:anywhere"),"Long translated homepage copy must not force horizontal overflow.");
assert.ok(homeCss.includes('html[dir="rtl"] .homePage .nextFeatureTile'),"Editorial feature tiles must support RTL alignment.");
assert.ok(app.includes('data-in-lang-key="Story shelves could not be loaded."')&&app.includes('data-in-lang-key="Try again"'),"Story shelf failure messages must expose translation keys.");

const globalNavigationKeys=["For You","Author","Language"];
assert.ok(globalNavigationKeys.every(key=>Object.keys(localeDictionary).every(code=>localeDictionary[code]?.[key])),"Global navigation and language-control labels must exist in every supported locale.");
assert.ok(app.includes('href="/for-you"')&&app.includes('href="/author"'),"Desktop navigation must expose For You and Author destinations.");
assert.ok(app.includes('data-in-lang-aria-label="Language"'),"Language selector accessible label must be localizable.");
const editorialHomeKeys=["Fantasy","Progression","Romance","Isekai","Original. Authorized. Reader-first.","THE IMPERIAL CREST","Read. Create. Conquer.","Light novels","Web novels","Manga & comics","Manhwa & webtoons","Explore the library","FRESH FROM THE REALM","New chapters. New reasons to stay.","Recently updated stories from the Imperial catalog.","Latest updates","Trend Factory","Spot story signals, explore metadata and find creators worth inviting. Rights review stays in control.","Read the signals ↗","World Forge","Shape your premise, build a story bible and draft chapters in a focused studio.","Build your world ↗","Reader Constellation","Find your people, trade theories and make a fandom feel alive.","Join the conversation ↗","A rights-first gateway for approved sources, creator attribution and future partnerships.","Explore the portal ↗","You're not just a reader.","Become an Author","Imperial Crown Vault ↗","Search titles, tropes, worlds...","Search novels, genres and authors","Checking service health…","Loading real-time data…","Checking the publication feed…","Calculating from recorded unlocks…","Mapping the published library…"];
for(const code of ["ur","hi","ar","fa"])assert.ok(editorialHomeKeys.every(key=>localeDictionary[code]?.[key]),code+" must translate the extended homepage editorial and navigation copy.");
assert.ok(editorialHomeKeys.filter(key=>!["Search titles, tropes, worlds...","Search novels, genres and authors"].includes(key)).every(key=>app.includes('data-in-lang-key="'+key+'"')||app.includes('data-in-lang-placeholder="'+key+'"')||app.includes('aria-label="'+key+'"')),"Extended homepage copy must be marked for live locale switching.");


assert.ok(app.includes('document.dispatchEvent(new Event("imperial:languagechange"))'),"Language changes must notify asynchronously rendered homepage content.");

assert.ok(app.includes('data-in-lang-key="A whole creative ecosystem built around the stories you love and the worlds you want to make."'),"Creator ecosystem introduction must be translatable.");

assert.ok(app.includes('"ur":{"Home":"صفحہ اول"')&&app.includes('"hi":{"Home":"होम"')&&app.includes('"ar":{"Home":"الرئيسية"')&&app.includes('"fa":{"Home":"خانه"'),"Urdu, Hindi, Arabic, and Persian dictionaries must remain available.");
assert.ok(app.includes('"Discover stories worth staying up for, then create the worlds only you can imagine.":"ایسی کہانیاں'),"Urdu homepage hero copy must be translated.");
assert.ok(app.includes('"Discover stories worth staying up for, then create the worlds only you can imagine.":"اكتشف قصصاً'),"Arabic homepage hero copy must be translated.");
assert.ok(app.includes('"Discover stories worth staying up for, then create the worlds only you can imagine.":"داستان‌هایی کشف کنید'),"Persian homepage hero copy must be nested in the Persian locale dictionary.");
assert.ok(css.includes("Homepage internationalization and RTL layout pass 17.45"),"Homepage must include a dedicated RTL layout refinement.");
assert.ok(css.includes('html[dir="rtl"] .homePage .heroSearch input{text-align:right}'),"RTL homepage search input must align to the reading direction.");
assert.ok(css.includes('html[dir="rtl"] .homePage .nextHeroCopy,'),"RTL hero alignment must target the real homepage copy container.");

assert.ok(app.includes("class=\"imperialHeroAuthor\" href=\"/become-an-author\"")&&app.includes("class=\"imperialHeroBrowse\" href=\"/catalog\""),"Homepage hero must provide direct creator onboarding and library discovery actions.");
assert.ok(css.includes(".imperialHeroVisual")&&css.includes("@media(max-width:760px)"),"Imperial crest composition must have responsive mobile behavior.");
assert.ok(css.includes("prefers-reduced-motion:reduce")&&css.includes(".imperialHeroSeal{transform:none}"),"Hero crest must respect reduced-motion preferences.");
assert.ok(app.includes("/api/discovery/graph?limit=60"),"Homepage must use the bounded live graph endpoint");
const homepageLoader=app.slice(app.indexOf("async function home(){"),app.indexOf("async function trendFactory"));
assert.ok(homepageLoader.includes("void (async()=>{"),"Catalog and discovery requests must run as independent non-blocking homepage tasks.");
assert.ok(homepageLoader.includes("void refreshPlatformPulse();"),"The initial live overview must not block homepage navigation from becoming interactive.");
assert.ok(!homepageLoader.includes("await refreshPlatformPulse();"),"Homepage boot must not wait for the real-time panel's network response.");
assert.ok(homepageLoader.includes("Promise.all([apiWithTimeout('/api/novels?sort=trending&limit=10'),apiWithTimeout('/api/novels?sort=updated&limit=10')])"),"Trending and latest catalog shelves must load concurrently.");
const trendingSectionIndex=homepageLoader.indexOf('<section class="section nextShelf">');
const platformPulseSectionIndex=homepageLoader.indexOf('<section class="platformPulse"');
assert.ok(trendingSectionIndex>=0&&platformPulseSectionIndex>trendingSectionIndex,"Reader-facing trending stories must appear before platform activity metrics in the homepage flow.");
assert.ok(homepageLoader.includes('id="trend" class="grid homeStoryGrid multiStory"'),"Trending cards must activate the responsive multi-story grid styles.");
assert.ok((homepageLoader.match(/class="skeletonCard"/g)||[]).length>=4,"Trending loading placeholders must fill a balanced two-column mobile row.");
assert.ok(css.includes("Story-card presentation pass 17.44"),"Story cards must include the dedicated visual presentation pass.");
assert.ok(css.includes(".homePage .homeStoryGrid .cover::after"),"Story covers must receive a subtle image treatment without changing source artwork.");
assert.ok(css.includes(".homePage .homeStoryGrid .meta span{"),"Real story metadata must be visually separated into readable badges.");
assert.ok(homepageLoader.includes("const trendingNovelIds=new Set(trendRows.map(row=>Number(row.id))"),"Homepage must identify novels already displayed in the trending shelf.");
assert.ok(homepageLoader.includes("const distinctLatestRows=latestRows.filter(row=>!trendingNovelIds.has(Number(row.id)))"),"Latest-updates shelf must not repeat novels already shown in trending.");
assert.ok(homepageLoader.includes("renderHomeStories('#latest',distinctLatestRows"),"Latest-updates shelf must render the de-duplicated list.");

assert.ok(app.includes("node.type==='genre'||node.type==='tag'"),"Only catalog genres and tags should become discovery links");
assert.ok(app.includes("encodeURIComponent(node.slug)"),"Discovery slugs must be URL encoded");
assert.ok(app.includes("esc(node.label)"),"Catalog labels must be HTML escaped before rendering");
assert.ok(app.includes("Connected discovery is temporarily unavailable"),"Graph failure must have a graceful fallback");
const storyCardRenderer=app.slice(app.indexOf("function card(n){"),app.indexOf("function chapterRow"));
assert.ok(storyCardRenderer.includes("Number.isFinite(rating)&&rating>0"),"Story cards must show ratings only when a real positive rating is present");
assert.ok(storyCardRenderer.includes("Number.isFinite(chapters)&&chapters>0"),"Story cards must show chapter counts only when a real positive count is present");
assert.ok(storyCardRenderer.includes("metadata?\x60<div class=\"meta\">"),"Story cards must omit the metadata row when both statistics are unavailable");
assert.ok(!storyCardRenderer.includes("Number(n.rating||0).toFixed(1)"),"Missing ratings must never be presented as a fabricated zero-star score");
assert.ok(!storyCardRenderer.includes("n.chapter_count||n.latest_chapter||0"),"Missing chapter counts must never be presented as zero chapters");
assert.ok(css.includes(".homeConnectionShelf")&&css.includes("@media(max-width:640px)"),"Connected discovery shelf needs responsive styling");
assert.ok(css.includes("Homepage mobile pass 17.42"),"Homepage must include the dedicated mobile refinement pass.");
assert.ok(css.includes("Homepage desktop and keyboard-accessibility pass 17.43"),"Homepage must include the desktop and keyboard accessibility refinement pass.");
assert.ok(/@media\(min-width:761px\)\s*\{[^}]*grid-template-columns:minmax\(0,1\.18fr\) minmax\(260px,\.82fr\)/s.test(css),"Desktop hero must retain a deliberate copy-and-crest composition.");
assert.ok(/\.homePage a:focus-visible,[\s\S]*?outline:3px solid var\(--in-focus\)/.test(css),"Homepage interactive links and controls must expose visible keyboard focus.");
assert.ok(/@media\(prefers-reduced-motion:reduce\)\s*\{[\s\S]*?\.homePage \.homeFormatCard,[\s\S]*?transform:none!important/s.test(css),"Homepage hover motion must respect reduced-motion preferences.");
const mobileCss=css.slice(css.indexOf("Homepage mobile pass 17.42"));
assert.ok(/\.imperialHeroVisual\s*\{[^}]*display:flex/s.test(mobileCss),"The imperial crest must remain visible in the compact mobile hero.");
assert.ok(/\.homePage \.heroSearch input\s*\{[^}]*font-size:16px/s.test(mobileCss),"Mobile search must retain a flexible input and avoid automatic mobile browser zoom.");
assert.ok(/\.homePage \.heroSearch button\s*\{[^}]*min-height:44px/s.test(mobileCss),"Mobile search action must retain an accessible touch target.");
assert.ok(mobileCss.includes(".homeStoryGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}"),"Mobile story shelves must preserve a compact two-column layout.");
assert.ok(mobileCss.includes(".homeStoryGrid .cardTitle{display:-webkit-box;"),"Mobile story titles must be clamped to prevent uneven cards.");
assert.ok(/\.platformPulseDetails\s*\{[^}]*grid-template-columns:1fr/s.test(mobileCss),"Platform activity panels must stack cleanly on mobile.");
assert.ok(css.includes(".homeFormatGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))"),"Desktop format discovery must use a balanced three-column grid.");
assert.ok(css.includes("@media(max-width:420px)")&&css.includes(".homeFormatGrid{gap:7px}"),"Narrow mobile format cards must use compact spacing.");
assert.ok(css.includes("border:1px solid var(--in-line)")&&css.includes("var(--in-brand) 5%"),"Homepage and real-time panels must use declared design tokens.");
assert.ok(!css.includes("var(--in-border)")&&!css.includes("var(--in-purple)"),"The design foundation must not depend on undefined legacy tokens.");
assert.ok(css.includes(".platformPulseRow:focus-visible")&&css.includes(".homeFormatCard:focus-visible"),"Homepage interactive shelves must have visible keyboard focus.");
assert.ok(css.includes("html[data-theme=\"dark\"] .homeFormatShelf"),"Format discovery must preserve the dark theme.");

const pulse=app.slice(app.indexOf(" let platformPulseRequest="),app.indexOf("async function trendFactory"));
assert.ok(pulse.includes("setInterval(()=>{if(document.visibilityState==='visible')refreshPlatformPulse()},60000)"),"Live overview must refresh once per minute while the page is visible");
assert.ok(pulse.includes("if(platformPulseRequest)return platformPulseRequest"),"Manual and scheduled refreshes must not overlap");
assert.ok(pulse.includes("last successful update"),"A failed refresh must preserve the last successful snapshot and disclose its age");
assert.ok(pulse.includes("second:'2-digit',timeZoneName:'short'"),"The refresh timestamp must show seconds and the visitor's local timezone");
assert.ok(pulse.includes("refreshes every 60 seconds"),"The live panel must disclose its refresh cadence");

assert.ok(app.includes('id="platformPulseHealth"'),"Homepage must expose a separate live service-health indicator");

const healthLabels=["Health status unavailable","Operational · ","Service issue · database unavailable","Refreshing…","Real-time data temporarily unavailable"];
for(const code of ["ur","hi","ar","fa"])assert.ok(healthLabels.every(label=>localeDictionary[code]?.[label]),code+" must translate live service-health and refresh states.");
assert.ok(app.includes('data-in-lang-key="Health status unavailable"')&&app.includes('data-in-lang-key="Service issue · database unavailable"'),"Live health states must expose locale keys.");
assert.ok(pulse.includes("apiWithTimeout('/api/health',{},10000)"),"Platform pulse must query the real health endpoint independently");
assert.ok(pulse.includes("service.ok===true&&service.database===true"),"Healthy status must require both Worker and database checks");
assert.ok(pulse.includes("Health status unavailable"),"Health-check failures must be disclosed instead of implying the service is healthy");
assert.ok(css.includes(".platformPulseHealth[data-state=\"healthy\"]")&&css.includes(".platformPulseHealth[data-state=\"degraded\"]"),"Service health states must have distinct visual treatment");

assert.ok(pulse.includes("Number.isSafeInteger(Number(row.novel_id))"),"Update-feed links must reject invalid record identifiers");
assert.ok(worker.includes('if(p==="/api/platform/overview"&&m==="GET")'),"Worker must expose the real platform overview endpoint");
assert.ok(worker.includes("readersInLast24Hours"),"Reader activity must be sourced from the recorded 24-hour history window");
assert.ok(worker.includes("FROM history h JOIN novels n"),"Reader activity must use actual signed-in reading history, not an invented online counter");
assert.ok(worker.includes("unlocked_at>=datetime('now','-7 days')"),"Trending momentum must use recorded seven-day chapter unlocks");
assert.ok(worker.includes("c.updated_at DESC,c.id DESC LIMIT 8"),"Latest updates must come from published chapter update timestamps");

const readerControls=["← Chapters","Chapter","Bookmark chapter","Cycle reader theme","Reader settings and chapter navigation","Chapter List","Close","Theme","Line spacing","Text width"];
for(const key of readerControls)assert.ok(app.includes('data-in-lang-key="'+key+'"')||app.includes('data-in-lang-aria-label="'+key+'"'),"Reader control must expose locale key: "+key);
const readerOptions=["Light","Dark","Midnight","Sepia","Imperial","Cosmic","Compact","Comfort","Relaxed","Focused","Standard","Wide"];
assert.ok(readerOptions.every(key=>app.includes('data-in-lang-option="'+key+'"')),"Reader theme and typography options must be localizable.");
assert.ok(app.includes("const READER_LANG=")&&app.includes("...(READER_LANG[c]||{})"),"Reader dictionaries must be merged into the active interface locale.");
assert.ok(app.includes('document.querySelectorAll("[data-in-lang-option]")'),"Reader select options must refresh when the language changes.");
assert.ok(app.includes("setINLang(document.documentElement.lang||localStorage.getItem('imperial_language')||'en')"),"Reader must apply the saved locale after its page markup is inserted.");

const novelOverviewKeys=["Views","Rating","Chapters","Rights","REAL-TIME STORY ACTIVITY","Recorded reader views and community activity for this story.","Loading activity…","Refresh ↻","Overview","Community","View chapter list","Reader Community","Rate this novel","Join the discussion"];
for(const key of novelOverviewKeys)assert.ok(app.includes('data-in-lang-key="'+key+'"'),"Novel overview text must expose locale key: "+key);
assert.ok(app.includes("const NOVEL_LANG=")&&app.includes("...(NOVEL_LANG[c]||{})"),"Novel overview translations must be merged into the active interface locale.");
assert.ok(app.includes("setINLang(document.documentElement.lang||localStorage.getItem('imperial_language')||'en');$('#libraryBtn').onclick"),"Novel overview must apply the saved locale after inserting its page markup.");

console.log("Homepage, novel overview and reader localization integration tests passed: versioned entry, live bounded graph, safe taxonomy links, escaped labels and graceful fallback.");
