import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [source,app,bundle,css,migration]=await Promise.all([
 readFile(new URL("../src/index.js",import.meta.url),"utf8"),
 readFile(new URL("../public/app.js",import.meta.url),"utf8"),
 readFile(new URL("../public/app-17.23.0.js",import.meta.url),"utf8"),
 readFile(new URL("../public/imperial-design-foundation.css",import.meta.url),"utf8"),
 readFile(new URL("../migrations/0012_chapter_update_timestamps.sql",import.meta.url),"utf8")
]);
const start=source.indexOf('if(p==="/api/platform/overview"&&m==="GET"){');
const end=source.indexOf('if(p==="/api/discovery/graph"&&m==="GET"){',start);
assert.ok(start>=0&&end>start,"Worker must expose the public platform overview endpoint before the discovery graph route");
const route=source.slice(start,end);
for(const field of ["publishedNovels","publishedChapters","creditedAuthors","catalogViews","readersInLast24Hours","chapterUpdatesLast24Hours"])assert.ok(route.includes(field),`Overview must expose the real ${field} metric`);
assert.ok(route.includes("new Date().toISOString()"),"Overview must expose the actual response timestamp");
assert.ok(route.includes("generated_at:generatedAt"),"The real-time response must expose a canonical generated_at timestamp.");
assert.ok(route.includes('mode:"request-time-d1-query"')&&route.includes('cache:"no-store"'),"Real-time overview freshness must be explicit and avoid stale HTTP caching.");
assert.ok(route.includes("metric_definitions:"),"Every platform metric must publish its definition.");
assert.ok(route.includes("readersInLast24Hours:" )&&route.includes("not current online users"),"Recent signed-in readers must not be represented as people online now.");
assert.ok(route.includes("measurement_windows:"),"The API must expose its measurement windows.");
assert.ok(route.includes("updated_at FROM chapters"),"The update feed must return source timestamps for individual chapters.");
assert.ok(route.includes("await ensurePublishingSchema(env)"),"Overview must safely ensure its chapter-view and update timestamp schema before querying");
assert.ok(source.includes("ALTER TABLE chapters ADD COLUMN updated_at TEXT"),"Runtime compatibility must add chapter update timestamps to existing databases");
assert.ok(source.includes("chapters_set_updated_at_after_insert"),"New chapters must receive an actual update timestamp");
assert.ok(source.includes("chapters_set_updated_at_after_edit"),"Edited chapter content and publication state must refresh the live update timestamp");
assert.ok(migration.includes("chapters_set_updated_at_after_edit")&&migration.includes("AFTER UPDATE OF title,content,chapter_number,publication_status"),"Fresh installations must receive the same chapter edit timestamp trigger");

assert.ok(route.includes("datetime('now','-24 hours')"),"Recent reader and chapter-view activity must use a rolling 24-hour window");
assert.ok(route.includes("datetime('now','-7 days')"),"Trending must use a rolling seven-day unlock window");
assert.ok(route.includes("publication_status='published' AND rights_status IN ('original','public_domain','licensed','authorized')"),"Every overview query must restrict results to published, rights-eligible catalog works");
assert.ok(route.includes("FROM history h JOIN novels n"),"Recent readers must come from recorded reading-history activity");
assert.ok(route.includes("c.updated_at>=datetime('now','-24 hours')"),"Recent chapter updates must use stored chapter update timestamps");
assert.ok(route.includes("recentUpdates:updates.results||[]"),"Overview must return actual recently updated published chapters");
assert.ok(route.includes("trending:trending.results||[]"),"Overview must return actual recent unlock-based trending stories");
assert.ok(!route.toLowerCase().includes("onlineusers")&&!route.toLowerCase().includes("activeusers"),"Do not imply a live-online count without presence tracking");
assert.ok(!route.includes("Math.random"),"Live platform metrics must never be randomized");
assert.ok(app.includes('id="platformPulseMetrics"')&&app.includes('id="platformPulseUpdates"')&&app.includes('id="platformPulseTrending"'),"Homepage must provide live metric, update and trend regions");
assert.ok(app.includes("apiWithTimeout('/api/platform/overview'"),"Homepage must consume the live overview API with a bounded request");
assert.ok(app.includes("setInterval(()=>{if(document.visibilityState==='visible')refreshPlatformPulse()},60000)"),"Homepage must refresh every 60 seconds only while visible");
assert.ok(app.includes("platformPulseRefresh"),"Readers must have a manual refresh control");
assert.ok(app.includes("Data generated "),"The homepage must display the exact generation timestamp for its metrics.");
assert.ok(app.includes("refreshes every 60 seconds while this page is visible"),"The freshness cadence must be visible and accurately described.");
assert.ok(app.includes("Updated '+esc(changedLabel)"),"Each recent chapter update must display its recorded timestamp.");
assert.ok(app.includes("Loading real-time data…"),"The interface must consistently describe real-time information rather than ambiguous live data.");
assert.ok(app.includes("Signed-in readers · 24h"),"Reader activity must be labelled accurately as signed-in activity");
assert.ok(app.includes("Credited authors")&&!app.includes("Public authors"),"The author metric must describe distinct credited author names, not imply verified profile accounts");
assert.equal(app,bundle,"Editable and versioned browser entry points must remain byte-for-byte synchronized");
assert.ok(css.includes(".platformPulseMetrics{display:grid;grid-template-columns:repeat(6"),"Live metrics must use a six-column desktop layout");
assert.ok(css.includes("@media(max-width:980px)")&&css.includes("@media(max-width:760px)"),"Live intelligence must adapt to tablet and phone layouts");
assert.ok(css.includes("@media(prefers-reduced-motion:reduce){.skeletonPulse{animation:none}}"),"Live skeletons must respect reduced-motion preferences");
assert.ok(app.includes("let notificationRefreshTimer=null"),"Notification polling must have a single managed timer");
assert.ok(app.includes("apiWithTimeout('/api/notifications',{},10000)"),"Notifications must refresh from the authenticated server endpoint with a request timeout");
assert.ok(app.includes("setInterval(()=>{if(location.pathname!=='/notifications')"),"Notification polling must stop when the user leaves the notifications page");
assert.ok(app.includes("document.visibilityState==='visible')loadNotifications()"),"Notification polling must pause while the page is hidden");
assert.ok(app.includes("setInterval(()=>{if(location.pathname!=='/notifications')"),"Notification polling must be scoped to the notifications route");
assert.ok(app.includes("aria-live=\"polite\"")&&app.includes("aria-busy=\"true\""),"Notification updates must announce status accessibly");
console.log("Platform real-time overview tests passed: truthful API metrics, rights filtering, 24-hour reading activity, seven-day unlock trends, refreshed homepage UI, responsive layout and synchronized browser bundles.");
