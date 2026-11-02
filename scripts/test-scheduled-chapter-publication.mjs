import assert from "node:assert/strict";
import fs from "node:fs";

const worker = fs.readFileSync("src/index.js", "utf8");
const migration = fs.readFileSync("migrations/0013_scheduled_chapter_publications.sql", "utf8");
const app = fs.readFileSync("public/app.js", "utf8");
const shipped = fs.readFileSync("public/app-17.24.0.js", "utf8");
const wrangler = fs.readFileSync("wrangler.toml", "utf8");

assert.ok(migration.includes("chapter_id INTEGER PRIMARY KEY"), "Each chapter must have at most one scheduled publication.");
assert.ok(migration.includes("publish_at TEXT NOT NULL"), "Scheduled publication time must be persisted.");
assert.ok(migration.includes("FOREIGN KEY(chapter_id) REFERENCES chapters(id) ON DELETE CASCADE"), "Deleting a chapter must clear its schedule.");
assert.ok(migration.includes("idx_scheduled_chapter_publications_due"), "Due schedules need an indexed publication time.");

const scheduleAt = worker.indexOf('if(/^\\/api\\/author\\/chapters\\/\\d+\\/schedule$/.test(p)&&m==="POST")');
assert.ok(scheduleAt >= 0, "Owner-scoped schedule API route must exist.");
const schedule = worker.slice(scheduleAt, worker.indexOf('if(p===" /api/admin/publishing"', scheduleAt) > 0 ? worker.indexOf('if(p===" /api/admin/publishing"', scheduleAt) : scheduleAt + 12000);
assert.ok(schedule.includes("You do not own this chapter"), "Scheduling must enforce chapter ownership.");
assert.ok(schedule.includes("c.novel_status!=='published'"), "Scheduling must require an approved published novel.");
assert.ok(schedule.includes("rights_status"), "Scheduling must check rights eligibility.");
assert.ok(schedule.includes("now+5*60*1000") && schedule.includes("365*24*60*60*1000"), "Schedule time must be bounded to 5 minutes through 365 days.");
assert.ok(schedule.includes("cancel===true"), "Authors must be able to cancel an existing schedule.");
assert.ok(schedule.includes("ON CONFLICT(chapter_id) DO UPDATE"), "Authors must be able to reschedule an existing chapter.");

const processorAt = worker.indexOf("async function publishDueChapters(env)");
assert.ok(processorAt >= 0, "Worker cron must process due chapter schedules.");
const processor = worker.slice(processorAt, worker.indexOf("export default", processorAt));
assert.ok(processor.includes("s.publish_at<=strftime"), "Only due schedules may publish.");
assert.ok(processor.includes("n.publication_status='published'"), "Scheduled publication must recheck novel approval at execution time.");
assert.ok(processor.includes("n.rights_status IN"), "Scheduled publication must recheck rights at execution time.");
assert.ok(processor.includes("author_chapter_scheduled_published"), "Scheduled publication must be audit logged.");
assert.ok(worker.includes("const published=await publishDueChapters(env)"), "Scheduled handler must invoke the due-publication processor.");
assert.ok(wrangler.includes('"*/15 * * * *"'), "Scheduled publishing must have a 15-minute Worker cron trigger.");

for (const [label, browser] of [["source", app], ["served asset", shipped]]) {
  assert.ok(browser.includes("authorChapterScheduleForm"), label + " must expose chapter scheduling.");
  assert.ok(browser.includes("/schedule"), label + " must call the scheduling API.");
  assert.ok(browser.includes("authorChapterScheduleCancel"), label + " must expose schedule cancellation.");
  assert.ok(browser.includes("next 15-minute Worker check"), label + " must explain the actual publication cadence.");
}
const calendarRouteAt = worker.indexOf('if(p==="/api/author/schedules"&&m==="GET")');
assert.ok(calendarRouteAt >= 0, "Author release calendar API must exist.");
const calendarRoute = worker.slice(calendarRouteAt, worker.indexOf('if(p==="/api/admin/publishing"', calendarRouteAt));
assert.ok(calendarRoute.includes("const e=author(u)"), "Release calendar must require an author or admin session.");
assert.ok(calendarRoute.includes("n.owner_user_id=?"), "Release calendar results must be owner-scoped.");
assert.ok(calendarRoute.includes("ORDER BY s.publish_at ASC LIMIT 200"), "Release calendar must be ordered and bounded.");
for (const [label, browser] of [["source", app], ["served asset", shipped]]) {
  assert.ok(browser.includes("authorReleaseCalendar"), label + " must render the release calendar.");
  assert.ok(browser.includes("api('/api/author/schedules')"), label + " must load the authenticated calendar API.");
  assert.ok(browser.includes("authorCalendarCancel"), label + " must expose schedule cancellation.");
  assert.ok(browser.includes("toLocaleDateString") && browser.includes("toLocaleTimeString"), label + " must display release times in local time.");
}
const planningRouteAt = worker.indexOf('if(p==="/api/author/planning"&&m==="GET")');
assert.ok(planningRouteAt >= 0, "Author chapter planning API must exist.");
const planningRoute = worker.slice(planningRouteAt, worker.indexOf('if(p==="/api/author/schedules"', planningRouteAt));
assert.ok(planningRoute.includes("const e=author(u)"), "Chapter planning must require an author or admin session.");
assert.ok(planningRoute.includes("n.owner_user_id=?"), "Chapter planning must be scoped to the current owner.");
assert.ok(planningRoute.includes("NOT EXISTS(SELECT 1 FROM scheduled_chapter_publications"), "Scheduled drafts must not appear as unfinished unscheduled work.");
assert.ok(planningRoute.includes("NOT EXISTS(SELECT 1 FROM chapters"), "Stories without chapters must appear in the planning queue.");
assert.ok(planningRoute.includes("ORDER BY updated_at DESC LIMIT 100"), "Planning queue must be bounded and sorted by recent activity.");
for (const [label, browser] of [["source", app], ["served asset", shipped]]) {
  assert.ok(browser.includes("authorPlanningQueue"), label + " must render the chapter planning queue.");
  assert.ok(browser.includes("api('/api/author/planning')"), label + " must load the authenticated planning API.");
  assert.ok(browser.includes("authorPlanningOpen"), label + " must link queue items to chapter management.");
}
assert.equal(app, shipped, "Source and served application assets must be identical.");
console.log("Scheduled chapter publication policy and UI checks passed.");
