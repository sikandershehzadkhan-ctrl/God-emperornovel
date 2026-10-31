import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [html,app,css,worker]=await Promise.all([
 readFile(new URL("../public/index.html",import.meta.url),"utf8"),
 readFile(new URL("../public/app-17.23.0.js",import.meta.url),"utf8"),
 readFile(new URL("../public/imperial-design-foundation.css",import.meta.url),"utf8"),
 readFile(new URL("../src/index.js",import.meta.url),"utf8")
]);
assert.ok(html.includes("/app-17.23.0.js"),"HTML must load the refreshed client bundle");
assert.equal(html.split("/app-17.23.0.js").length-1,1,"HTML must reference the current versioned client bundle exactly once");
assert.ok(app.includes("id=\"homeConnections\""),"Homepage must expose the connected discovery region");
assert.ok(app.includes("imperialHeroVisual")&&app.includes("/imperial-novel-app-icon.svg"),"Homepage hero must feature the approved Imperial black-sun and empty-throne crest.");
assert.ok(app.includes("A NEW ERA OF STORYTELLING")&&app.includes("THE IMPERIAL CREST"),"Homepage hero must establish a distinct editorial identity.");
assert.ok(css.includes(".imperialHeroVisual")&&css.includes("@media(max-width:760px)"),"Imperial crest composition must have responsive mobile behavior.");
assert.ok(css.includes("prefers-reduced-motion:reduce")&&css.includes(".imperialHeroSeal{transform:none}"),"Hero crest must respect reduced-motion preferences.");
assert.ok(app.includes("/api/discovery/graph?limit=60"),"Homepage must use the bounded live graph endpoint");
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
