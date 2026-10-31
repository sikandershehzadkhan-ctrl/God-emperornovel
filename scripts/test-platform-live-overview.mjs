import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [source,app,bundle,css]=await Promise.all([
 readFile(new URL("../src/index.js",import.meta.url),"utf8"),
 readFile(new URL("../public/app.js",import.meta.url),"utf8"),
 readFile(new URL("../public/app-17.23.0.js",import.meta.url),"utf8"),
 readFile(new URL("../public/imperial-design-foundation.css",import.meta.url),"utf8")
]);
const start=source.indexOf('if(p==="/api/platform/overview"&&m==="GET"){');
const end=source.indexOf('if(p==="/api/discovery/graph"&&m==="GET"){',start);
assert.ok(start>=0&&end>start,"Worker must expose the public platform overview endpoint before the discovery graph route");
const route=source.slice(start,end);
for(const field of ["publishedNovels","publishedChapters","publicAuthors","catalogViews","readersInLast24Hours","chapterViewsInLast24Hours"])assert.ok(route.includes(field),`Overview must expose the real ${field} metric`);
assert.ok(route.includes("new Date().toISOString()"),"Overview must expose the actual response timestamp");
assert.ok(route.includes("datetime('now','-24 hours')"),"Recent reader and chapter-view activity must use a rolling 24-hour window");
assert.ok(route.includes("datetime('now','-7 days')"),"Trending must use a rolling seven-day unlock window");
assert.ok(route.includes("publication_status='published' AND rights_status IN ('original','public_domain','licensed','authorized')"),"Every overview query must restrict results to published, rights-eligible catalog works");
assert.ok(route.includes("FROM history h JOIN novels n"),"Recent readers must come from recorded reading-history activity");
assert.ok(route.includes("FROM chapter_views v JOIN chapters c"),"Recent chapter views must come from recorded chapter-view events");
assert.ok(route.includes("recentUpdates:updates.results||[]"),"Overview must return actual recently updated published chapters");
assert.ok(route.includes("trending:trending.results||[]"),"Overview must return actual recent unlock-based trending stories");
assert.ok(!route.toLowerCase().includes("onlineusers")&&!route.toLowerCase().includes("activeusers"),"Do not imply a live-online count without presence tracking");
assert.ok(!route.includes("Math.random"),"Live platform metrics must never be randomized");
assert.ok(app.includes('id="platformPulseMetrics"')&&app.includes('id="platformPulseUpdates"')&&app.includes('id="platformPulseTrending"'),"Homepage must provide live metric, update and trend regions");
assert.ok(app.includes("apiWithTimeout('/api/platform/overview'"),"Homepage must consume the live overview API with a bounded request");
assert.ok(app.includes("setInterval(()=>{if(document.visibilityState==='visible')refreshPlatformPulse()},60000)"),"Homepage must refresh every 60 seconds only while visible");
assert.ok(app.includes("platformPulseRefresh"),"Readers must have a manual refresh control");
assert.ok(app.includes("Signed-in readers · 24h"),"Reader activity must be labelled accurately as signed-in activity");
assert.equal(app,bundle,"Editable and versioned browser entry points must remain byte-for-byte synchronized");
assert.ok(css.includes(".platformPulseMetrics{display:grid;grid-template-columns:repeat(6"),"Live metrics must use a six-column desktop layout");
assert.ok(css.includes("@media(max-width:980px)")&&css.includes("@media(max-width:760px)"),"Live intelligence must adapt to tablet and phone layouts");
assert.ok(css.includes("@media(prefers-reduced-motion:reduce){.skeletonPulse{animation:none}}"),"Live skeletons must respect reduced-motion preferences");
console.log("Platform live overview tests passed: truthful API metrics, rights filtering, 24-hour reading activity, seven-day unlock trends, refreshed homepage UI, responsive layout and synchronized browser bundles.");
