import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [source,app,bundle,css,migration,engagementMigration,viewAnalyticsMigration]=await Promise.all([
 readFile(new URL("../src/index.js",import.meta.url),"utf8"),
 readFile(new URL("../public/app.js",import.meta.url),"utf8"),
 readFile(new URL("../public/app-17.23.0.js",import.meta.url),"utf8"),
 readFile(new URL("../public/imperial-design-foundation.css",import.meta.url),"utf8"),
 readFile(new URL("../migrations/0013_chapter_update_timestamps.sql",import.meta.url),"utf8"),
 readFile(new URL("../migrations/0014_reader_engagement_metrics.sql",import.meta.url),"utf8"),
 readFile(new URL("../migrations/0015_daily_view_analytics.sql",import.meta.url),"utf8")
]);
const start=source.indexOf('if(p==="/api/platform/overview"&&m==="GET"){');
const end=source.indexOf('if(p==="/api/discovery/graph"&&m==="GET"){',start);
assert.ok(start>=0&&end>start,"Worker must expose the public platform overview endpoint before the discovery graph route");
const route=source.slice(start,end);
for(const field of ["publishedNovels","publishedChapters","creditedAuthors","catalogViews","readersInLast24Hours","chapterUpdatesLast24Hours"])assert.ok(route.includes(field),`Overview must expose the real ${field} metric`);
for(const field of ["chapterViews","visibleComments","commentsLast24Hours","commentLikes","novelReactions","ratings","bookmarks","follows"])assert.ok(route.includes(field),`Overview must expose recorded engagement metric ${field}`);
for(const table of ["chapter_views","comments","comment_likes","novel_reactions","ratings","bookmarks","follows"])assert.ok(route.includes(table),`Engagement totals must be queried from the existing ${table} event or state table`);
assert.ok(route.includes("cm.status='visible'"),"Comment totals must exclude hidden or deleted comments.");
assert.ok(route.includes("cm.created_at>=datetime('now','-24 hours')"),"Recent comment activity must use a rolling 24-hour window.");
assert.ok(route.includes("Cumulative chapter view requests")&&route.includes("not unique readers"),"Chapter views must not be misrepresented as unique readers.");
assert.ok(source.includes("async function ensureEngagementSchema(env)")&&source.includes("CREATE TABLE IF NOT EXISTS comment_likes")&&source.includes("CREATE TABLE IF NOT EXISTS novel_reactions"),"Engagement endpoints must safely initialize the reaction and comment-like tables on existing databases.");
assert.ok(route.includes("await ensureEngagementSchema(env)"),"The overview endpoint must ensure engagement tables exist before querying their totals.");
const novelEngagementStart=source.indexOf('if(p==="/api/novel-engagement"&&m==="GET"){');
const novelEngagementEnd=source.indexOf('if(p==="/api/platform/overview"&&m==="GET"){',novelEngagementStart);
assert.ok(novelEngagementStart>=0&&novelEngagementEnd>novelEngagementStart,"A dedicated per-novel engagement endpoint must exist before the platform overview route.");
const novelEngagementRoute=source.slice(novelEngagementStart,novelEngagementEnd);
for(const field of ["novelViews","chapterViews","visibleComments","commentLikes","novelReactions","ratings"])assert.ok(novelEngagementRoute.includes(field),`Per-novel activity must expose ${field}.`);
assert.ok(novelEngagementRoute.includes("await ensureEngagementSchema(env)")&&novelEngagementRoute.includes("await ensurePublishingSchema(env)"),"Per-novel activity must ensure the required D1 tables exist.");
assert.ok(novelEngagementRoute.includes("clientRefreshSeconds:30")&&novelEngagementRoute.includes('cache:"no-store"'),"Per-novel activity must declare its near-real-time polling and cache behavior.");
assert.ok(!novelEngagementRoute.includes("UPDATE novels SET views"),"Reading the activity endpoint must not increment novel views.");
const chapterEngagementStart=source.indexOf('if(p==="/api/chapter-engagement"&&m==="GET"){');
const chapterEngagementEnd=source.indexOf('if(p==="/api/novel-engagement"&&m==="GET"){',chapterEngagementStart);
assert.ok(chapterEngagementStart>=0&&chapterEngagementEnd>chapterEngagementStart,"A dedicated per-chapter activity endpoint must exist.");
const chapterEngagementRoute=source.slice(chapterEngagementStart,chapterEngagementEnd);
for(const field of ["chapterReaderRequests","unlocks","signedInReadersLast24Hours"])assert.ok(chapterEngagementRoute.includes(field),`Chapter activity must expose ${field}.`);
assert.ok(chapterEngagementRoute.includes("c.publication_status='published'")&&chapterEngagementRoute.includes("n.rights_status IN"),"Chapter activity must be limited to published, rights-eligible stories.");
assert.ok(chapterEngagementRoute.includes("clientRefreshSeconds:30")&&chapterEngagementRoute.includes('cache:"no-store"'),"Chapter activity must declare its 30-second near-real-time freshness contract.");
assert.ok(chapterEngagementRoute.includes("Not unique readers")&&chapterEngagementRoute.includes("not a live-online count"),"Chapter activity must disclose the limits of request and reading-history counters.");
assert.ok(app.includes('id="chapterActivityMetrics"')&&app.includes("refreshChapterActivity"),"The chapter reader must display a dedicated activity panel.");
assert.ok(app.includes("/api/chapter-engagement?chapter_id="),"Chapter activity must use its read-only endpoint.");
assert.ok(app.includes("setInterval(()=>{if(document.visibilityState==='visible')refreshChapterActivity()},30000)"),"Chapter activity polling must pause while the page is hidden.");
assert.ok(css.includes(".chapterLivePulseMetrics{display:grid;grid-template-columns:repeat(3")&&css.includes("@media(max-width:560px)"),"Chapter activity must have responsive desktop and mobile layouts.");


assert.ok(!engagementMigration.includes("CREATE TABLE")&&!engagementMigration.includes("CREATE INDEX"),"Engagement migration slot must remain dependency-free; canonical community tables and query indexes are owned by migration 0012.");
assert.ok(source.includes("CREATE TABLE IF NOT EXISTS comment_likes")&&source.includes("CREATE TABLE IF NOT EXISTS novel_reactions"),"Existing installations must receive idempotent engagement table readiness before querying.");
assert.ok(!engagementMigration.includes("CREATE TABLE IF NOT EXISTS comment_likes")&&!engagementMigration.includes("CREATE TABLE IF NOT EXISTS novel_reactions"),"Engagement migration must not redefine canonical community tables.");
assert.ok(viewAnalyticsMigration.includes("CREATE TABLE IF NOT EXISTS novel_view_daily")&&viewAnalyticsMigration.includes("CREATE TABLE IF NOT EXISTS chapter_view_daily"),"Migration 0014 must add daily aggregate counters for novel and chapter views.");
assert.ok(viewAnalyticsMigration.includes("PRIMARY KEY(novel_id, view_date)")&&viewAnalyticsMigration.includes("PRIMARY KEY(chapter_id, view_date)"),"Daily view aggregates must be uniquely keyed per content item and date.");
assert.ok(source.includes("async function ensureViewAnalyticsSchema(env)")&&source.includes("CREATE TABLE IF NOT EXISTS novel_view_daily")&&source.includes("CREATE TABLE IF NOT EXISTS chapter_view_daily"),"Existing D1 databases must receive daily view tables through idempotent runtime schema readiness.");
assert.ok(source.includes("INSERT INTO novel_view_daily(novel_id,view_date,view_requests)")&&source.includes("INSERT INTO chapter_view_daily(chapter_id,view_date,view_requests)"),"Novel and chapter page requests must increment their daily aggregate counters.");
assert.ok(source.includes("novelViewsInPeriod")&&source.includes("chapterReaderRequestsInPeriod")&&source.includes("chapterViewsInPeriod"),"Author analytics must expose selected-period novel and chapter view counts.");
assert.ok(source.includes("View history starts when daily view tracking is enabled; earlier counters are not backfilled"),"The API must disclose that daily view history starts at instrumentation rollout and is not backfilled.");
assert.ok(app.includes("Novel views · period")&&app.includes("Chapter requests · period")&&app.includes("period views"),"Author Studio must display selected-period view totals alongside lifetime request counters.");



const catalogRouteStart=source.indexOf('if(p==="/api/novels"){');
const catalogRouteEnd=source.indexOf('let nm=p.match(/^\\/api\\/novels\\/(\\d+)$/)',catalogRouteStart);
assert.ok(catalogRouteStart>=0&&catalogRouteEnd>catalogRouteStart,"Catalog API route must be present for rating-filter validation.");
const catalogRoute=source.slice(catalogRouteStart,catalogRouteEnd);
assert.ok(catalogRoute.includes("Math.min(10,minRating)"),"Catalog minimum-rating filtering must support the complete 1-10 rating scale.");
for(const value of [10,9,8,7,6,5,4,3,2,1])assert.ok(app.includes(`<option value="${value}">${value}+</option>`),`Catalog UI must offer the ${value}+ whole-number rating filter.`);

assert.ok(route.includes("new Date().toISOString()"),"Overview must expose the actual response timestamp");
assert.ok(route.includes("generated_at:generatedAt"),"The real-time response must expose a canonical generated_at timestamp.");
assert.ok(route.includes('mode:"request-time-d1-query"')&&route.includes('cache:"no-store"'),"Real-time overview freshness must be explicit and avoid stale HTTP caching.");
assert.ok(source.includes('"cache-control":"no-store"'),"JSON API responses must default to no-store so real-time reads are not served stale.");
assert.ok(route.includes("metric_definitions:"),"Every platform metric must publish its definition.");
assert.ok(route.includes("readersInLast24Hours:" )&&route.includes("not current online users"),"Recent signed-in readers must not be represented as people online now.");
assert.ok(route.includes("measurement_windows:"),"The API must expose its measurement windows.");
assert.ok(route.includes("c.updated_at FROM chapters"),"The update feed must return source timestamps for individual chapters.");
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
for(const label of ["Novel views · all-time","Chapter views · all-time","Visible comments","New comments · 24h","Comment likes","Novel reactions","Reader ratings","Bookmarks","Novel follows"])assert.ok(app.includes(label),`Homepage must display the recorded ${label} metric.`);
assert.ok(app.includes("metricCards.map")&&app.includes("title=\"'+esc(definition)+'\""),"Homepage engagement metrics must expose concise definitions for their measurement.");
assert.ok(app.includes("measured from recorded platform events"),"Homepage must explain that engagement counts come from recorded events.");
assert.ok(app.includes('id="novelEngagementMetrics"')&&app.includes("loadNovelEngagement(id)"),"Novel detail pages must display their own reader and community activity.");
assert.ok(app.includes("setInterval(()=>{if(document.visibilityState==='visible')loadNovelEngagement(id)},30000)"),"Novel engagement must refresh every 30 seconds only while visible.");
assert.ok(app.includes("/api/novel-engagement?novel_id="),"Novel detail activity must use its read-only engagement endpoint rather than recounting views via the novel page route.");
assert.ok(css.includes(".novelLivePulseMetrics{display:grid;grid-template-columns:repeat(6")&&css.includes("@media(max-width:600px)"),"Per-novel engagement metrics must adapt to narrow mobile screens.");


assert.ok(app.includes("Credited authors")&&!app.includes("Public authors"),"The author metric must describe distinct credited author names, not imply verified profile accounts");
const authorAnalyticsStart=source.indexOf('if(p==="/api/author/analytics"&&m==="GET"){');
const authorAnalyticsEnd=source.indexOf('if(p==="/api/author/novels"&&m==="GET"){',authorAnalyticsStart);
assert.ok(authorAnalyticsStart>=0&&authorAnalyticsEnd>authorAnalyticsStart,"A dedicated Author Studio analytics endpoint must exist.");
const authorAnalyticsRoute=source.slice(authorAnalyticsStart,authorAnalyticsEnd);
assert.ok(authorAnalyticsRoute.includes("const e=author(u);")&&authorAnalyticsRoute.includes("n.owner_user_id=?"),"Author analytics must require author access and scope stories to the signed-in owner.");
assert.ok(authorAnalyticsRoute.includes("[7,30,90]")&&authorAnalyticsRoute.includes("datetime('now','-'||?||' days')"),"Author analytics must support validated 7, 30 and 90-day windows.");
for(const field of ["novelViews","chapterReaderRequests","unlocks","readerTicketSpend","comments","commentLikes","reactions","currentRatings","currentBookmarks","currentFollows"])assert.ok(authorAnalyticsRoute.includes(field),`Author analytics must define ${field}.`);
assert.ok(authorAnalyticsRoute.includes("n.publication_status='published'")&&authorAnalyticsRoute.includes("n.rights_status IN ('original','public_domain','licensed','authorized')"),"Public engagement analytics must exclude unpublished and rights-ineligible works.");
assert.ok(authorAnalyticsRoute.includes("readerTicketSpend:")&&authorAnalyticsRoute.includes("not author earnings"),"Reader ticket spending must not be presented as author income.");
assert.ok(authorAnalyticsRoute.includes("View history starts when daily view tracking is enabled; earlier counters are not backfilled")&&authorAnalyticsRoute.includes("Lifetime views are cumulative counters"),"The API must disclose that historical view trends are not currently recorded.");
assert.ok(authorAnalyticsRoute.includes("clientRefreshSeconds:60")&&authorAnalyticsRoute.includes('cache:"no-store"'),"Author analytics must declare its request-time, no-store, 60-second refresh contract.");
assert.ok(authorAnalyticsRoute.includes("stories:eligible.map")&&authorAnalyticsRoute.includes("publishedNovels:eligible.length"),"The story breakdown and summary must include only published, rights-eligible novels owned by this author.");
assert.ok(authorAnalyticsRoute.includes("currentAverageRating")&&authorAnalyticsRoute.includes("timeline"),"The author summary must include a weighted rating average and timestamped activity timeline.");
assert.ok(authorAnalyticsRoute.includes("chapterRows")&&authorAnalyticsRoute.includes("chapterReaderRequests")&&authorAnalyticsRoute.includes("readerTicketSpendInPeriod"),"Author analytics must return individual chapter request, unlock and reader ticket-spend metrics.");
assert.ok(authorAnalyticsRoute.includes("SUM(v.view_requests)")&&authorAnalyticsRoute.includes("SUM(novelViews) novelViews")&&authorAnalyticsRoute.includes("SUM(chapterViews) chapterViews"),"Daily view timelines must sum aggregate request counters rather than count aggregate rows.");
assert.ok(authorAnalyticsRoute.includes("SUM(follows) follows"),"Adding daily view series must preserve follow activity in the author timeline.");
assert.ok(source.includes("ensureViewAnalyticsSchema(env);await env.DB.prepare(\"INSERT INTO novel_view_daily")&&source.includes("ensureViewAnalyticsSchema(env);await env.DB.prepare(\"INSERT INTO chapter_view_daily"),"Both public detail routes must record daily views without blocking their existing lifetime counters.");

assert.ok(authorAnalyticsRoute.includes("LIMIT 100"),"Chapter performance must be bounded to avoid unbounded dashboard queries.");
assert.ok(app.includes('id="authorAnalyticsChapters"')&&app.includes("Chapter performance"),"Author Studio must render a per-chapter performance breakdown.");
assert.ok(app.includes("No published chapters have activity data yet"),"The chapter performance section must have a truthful empty state.");
assert.ok(css.includes(".authorAnalyticsChapterStats{display:flex")&&css.includes(".authorAnalyticsChapter{display:grid"),"Chapter analytics must have dedicated responsive list styling.");

assert.ok(app.includes("Published stories")&&app.includes("No published, rights-eligible stories have analytics yet"),"The Author Studio must distinguish an empty published analytics catalog from an empty draft library.");

assert.ok(app.includes('id="authorAnalyticsMetrics"')&&app.includes('id="authorAnalyticsStories"')&&app.includes('id="authorAnalyticsTimeline"'),"Author Studio must render summary, story performance and daily activity regions.");
assert.ok(app.includes("/api/author/analytics?days=")&&app.includes("setInterval(()=>{if(document.visibilityState==='visible')loadAuthorAnalytics()},60000)"),"Author analytics must fetch the selected range and poll only while the page is visible.");
assert.ok(app.includes("Reader spend, not author earnings")&&app.includes("How these numbers are calculated"),"Author analytics UI must disclose reader spend and measurement limits.");
assert.ok(css.includes(".authorAnalyticsMetrics{display:grid;grid-template-columns:repeat(4")&&css.includes("@media(max-width:480px){.authorAnalyticsMetrics{grid-template-columns:repeat(2"),"Author analytics must have responsive desktop and phone layouts.");
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
