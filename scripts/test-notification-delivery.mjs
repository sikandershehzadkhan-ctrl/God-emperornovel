import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const worker = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const app = readFileSync(new URL("../public/app-17.23.0.js", import.meta.url), "utf8");

const listRoute = worker.match(/if\(p==="\/api\/notifications"&&m==="GET"\)\{([\s\S]*?)\n\s*if\(p==="\/api\/notifications\/read"/);
assert.ok(listRoute, "notification list route must exist");
assert.ok(listRoute[1].includes("need(u)"), "notification listing must require authentication");
assert.ok(listRoute[1].includes("WHERE user_id=?"), "notification listing must be scoped to the signed-in user");
assert.ok(listRoute[1].includes("ORDER BY created_at DESC LIMIT 50"), "notification listing must be newest-first and bounded");

const readRoute = worker.match(/if\(p==="\/api\/notifications\/read"&&m==="POST"\)\{([\s\S]*?)\n\s*if\(p==="\/api\/report"/);
assert.ok(readRoute, "mark-read route must exist");
assert.ok(readRoute[1].includes("need(u)"), "mark-read action must require authentication");
assert.ok(readRoute[1].includes("WHERE user_id=? AND read_at IS NULL"), "mark-read action must only affect the signed-in user's unread notifications");

assert.ok(worker.includes("INSERT INTO notifications(user_id,title,body)"), "notification creation must persist to the account notification table");
const commentRoute = worker.match(/if\(p==="\/api\/comments"&&m==="POST"\)\{([\s\S]*?)\n\s*if\(p==="\/api\/comments\/like"/);
assert.ok(commentRoute, "comment creation route must exist");
assert.ok(commentRoute[1].includes("await notifyUser(env,parentAuthor"), "comment replies must notify the parent comment author");
assert.ok(commentRoute[1].includes("await notifyUser(env,owner"), "novel comments must notify the novel owner");
assert.ok(commentRoute[1].includes("owner!==Number(u.id)"), "authors must not receive notifications for their own comments");
const followRoute = worker.match(/if\(p==="\/api\/follow"&&m==="POST"\)\{([\s\S]*?)\n\s*if\(p==="\/api\/rating"/);
assert.ok(followRoute, "follow toggle route must exist");
assert.ok(followRoute[1].includes("Number.isSafeInteger(nid)"), "follow route must validate a positive safe novel id");
assert.ok(followRoute[1].includes("publication_status='published'"), "users may only follow published novels");
assert.ok(followRoute[1].includes("await notifyUser(env,owner"), "new follows must notify the novel owner");
assert.ok(followRoute[1].includes("owner!==Number(u.id)"), "authors must not be notified when following their own novel");
assert.ok(followRoute[1].indexOf("if(f){") < followRoute[1].indexOf("await notifyUser(env,owner"), "unfollow actions must not generate follow notifications");


assert.ok(app.includes("apiWithTimeout('/api/notifications',{},10000)"), "notification UI must use a bounded request");
assert.ok(app.includes("setInterval(()=>{if(location.pathname!=='/notifications')"), "notification refresh must stop after leaving the notifications page");
assert.ok(app.includes("document.visibilityState==='visible'"), "notification polling must pause while the page is hidden");
assert.ok(app.includes("},30000)"), "notification polling interval must be bounded to 30 seconds");
console.log("PASS: notification authentication, per-user isolation, bounded listing, read isolation and visibility-aware polling.");
