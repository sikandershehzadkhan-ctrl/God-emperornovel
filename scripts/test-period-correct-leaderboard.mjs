import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const source=await readFile(new URL("../src/index.js",import.meta.url),"utf8");
const start=source.indexOf('if(p==="/api/leaderboard"&&m==="GET"){');
const end=source.indexOf('if(p==="/api/tier-list"&&m==="GET"){',start);
assert.ok(start>=0&&end>start);
const route=source.slice(start,end);
assert.ok(route.includes("['weekly','monthly','all'].includes(requestedPeriod)"));
assert.ok(route.includes("rankingMetric:'chapter_unlocks'"));
assert.ok(route.includes("u.unlocked_at>=datetime('now','-"));
assert.ok(route.includes("uc.publication_status='published'"));
assert.ok(route.includes("n.publication_status='published' AND n.rights_status IN ('original','public_domain','licensed','authorized')"));
assert.ok(route.includes("activity.unlocks DESC"));
assert.ok(route.includes("GROUP BY n.id HAVING unlocks>0"),"novel leaderboard must not pad rankings with zero-unlock entries");
assert.ok(route.includes("NULLIF(TRIM(author),'')"));
assert.ok(!route.includes("h.updated_at"));

const app=await readFile(new URL("../public/app.js",import.meta.url),"utf8");
const served=await readFile(new URL("../public/app-17.23.0.js",import.meta.url),"utf8");
assert.equal(app,served,"canonical and served browser bundles must remain byte-identical");
assert.ok(app.includes("Ranked by chapter unlocks in the selected period."),"novel ranking metric must be visible");
assert.ok(app.includes("Ranked by chapter unlocks across eligible published stories."),"author ranking metric must be visible");
assert.ok(app.includes("Number(n.unlocks||0).toLocaleString()} ${rankingText('unlocks')}"),"novel cards must show period unlock counts");
assert.ok(app.includes("Number(x.unlocks||0).toLocaleString()} ${rankingText('unlocks')}"),"author cards must show period unlock counts");
assert.ok(source.includes("CREATE INDEX IF NOT EXISTS idx_unlocks_chapter_time ON unlocks(chapter_id,unlocked_at)"),"chapter/time lookup index must exist in runtime bootstrap");

console.log("PASS: leaderboard validates periods, ranks by period-scoped chapter unlocks, normalizes author identity, and excludes unpublished or uncleared works.");
