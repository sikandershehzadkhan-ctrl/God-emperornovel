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
assert.ok(app.includes("class=\"imperialHeroAuthor\" href=\"/become-an-author\"")&&app.includes("class=\"imperialHeroBrowse\" href=\"/catalog\""),"Homepage hero must provide direct creator onboarding and library discovery actions.");
assert.ok(css.includes(".imperialHeroVisual")&&css.includes("@media(max-width:760px)"),"Imperial crest composition must have responsive mobile behavior.");
assert.ok(css.includes("prefers-reduced-motion:reduce")&&css.includes(".imperialHeroSeal{transform:none}"),"Hero crest must respect reduced-motion preferences.");
assert.ok(app.includes("/api/discovery/graph?limit=60"),"Homepage must use the bounded live graph endpoint");
const homepageLoader=app.slice(app.indexOf("async function home(){"),app.indexOf("\\nasync function trendFactory"));
assert.ok(homepageLoader.includes("void (async()=>{"),"Catalog and discovery requests must run as independent non-blocking homepage tasks.");
assert.ok(homepageLoader.includes("void refreshPlatformPulse();"),"The initial live overview must not block homepage navigation from becoming interactive.");
assert.ok(!homepageLoader.includes("await refreshPlatformPulse();"),"Homepage boot must not wait for the real-time panel's network response.");
assert.ok(homepageLoader.includes("Promise.all([apiWithTimeout('/api/novels?sort=trending&limit=10'),apiWithTimeout('/api/novels?sort=updated&limit=10')])"),"Trending and latest catalog shelves must load concurrently.");
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
assert.ok(/\.imperialHeroVisual\s*\{[^}]*display:flex/s.test(css),"The imperial crest must remain visible in the compact mobile hero.");
assert.ok(/\.homePage \.heroSearch input\s*\{[^}]*font-size:16px/s.test(css),"Mobile search must retain a flexible input and avoid automatic mobile browser zoom.");
assert.ok(/\.homePage \.heroSearch button\s*\{[^}]*min-height:44px/s.test(css),"Mobile search action must retain an accessible touch target.");
assert.ok(css.includes(".homeStoryGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}"),"Mobile story shelves must preserve a compact two-column layout.");
assert.ok(css.includes(".homeStoryGrid .cardTitle{display:-webkit-box;"),"Mobile story titles must be clamped to prevent uneven cards.");
assert.ok(/\.platformPulseDetails\s*\{[^}]*grid-template-columns:1fr/s.test(css),"Platform activity panels must stack cleanly on mobile.");
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

console.log("Homepage connected-discovery integration tests passed: versioned entry, live bounded graph, safe taxonomy links, escaped labels and graceful fallback.");
