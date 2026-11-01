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
assert.ok(worker.includes("WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE user_id=? AND title=? AND body=? AND created_at>=datetime('now','-10 minutes'))"), "identical notification events must be deduplicated within a ten-minute cooldown");

const commentsRead = worker.match(/if\(p==="\/api\/comments"&&m==="GET"\)\{([\s\S]*?)\n\s*if\(p==="\/api\/comments"&&m==="POST"/);
assert.ok(commentsRead, "public comment read route must exist");
assert.ok(commentsRead[1].includes("Number.isSafeInteger(novel)"), "comment reads must validate a positive safe novel id");
assert.ok(commentsRead[1].includes("publication_status='published'"), "comment reads must be restricted to published novels");
assert.ok(commentsRead[1].includes("rights_status IN ('original','public_domain','licensed','authorized')"), "comment reads must enforce publication rights clearance");
const commentRoute = worker.match(/if\(p==="\/api\/comments"&&m==="POST"\)\{([\s\S]*?)\n\s*if\(p==="\/api\/comments\/like"/);
assert.ok(commentRoute, "comment creation route must exist");
assert.ok(commentRoute[1].includes("await notifyUser(env,parentAuthor"), "comment replies must notify the parent comment author");
assert.ok(commentRoute[1].includes("await notifyUser(env,owner"), "novel comments must notify the novel owner");
assert.ok(commentRoute[1].includes("owner!==Number(u.id)"), "authors must not receive notifications for their own comments");
const moderationRoute = worker.match(/if\\(p==="\\/api\\/admin\\/community\\/comments"&&m==="PATCH"\\)\\{([\\s\\S]*?)\\n\\s*if\\(p==="\\/api\\/admin\\/community\\/reports"&&m==="GET"/);
assert.ok(moderationRoute, "admin comment moderation route must exist");
assert.ok(moderationRoute[1].includes("admin(u)"), "comment moderation must require administrator access");
assert.ok(moderationRoute[1].includes("Number.isSafeInteger(cid)||cid<1"), "comment moderation must validate a positive safe comment id");
assert.ok(moderationRoute[1].includes("SELECT id,status FROM comments WHERE id=?"), "comment moderation must verify the target exists");
assert.ok(moderationRoute[1].includes("community_comment_"), "comment moderation actions must be written to the audit log");
const followRoute = worker.match(/if\(p==="\/api\/follow"&&m==="POST"\)\{([\s\S]*?)\n\s*if\(p==="\/api\/rating"/);
assert.ok(followRoute, "follow toggle route must exist");
assert.ok(followRoute[1].includes("Number.isSafeInteger(nid)"), "follow route must validate a positive safe novel id");
assert.ok(followRoute[1].includes("publication_status='published'"), "users may only follow published novels");
assert.ok(followRoute[1].includes("await notifyUser(env,owner"), "new follows must notify the novel owner");
assert.ok(followRoute[1].includes("owner!==Number(u.id)"), "authors must not be notified when following their own novel");
assert.ok(followRoute[1].indexOf("if(f){") < followRoute[1].indexOf("await notifyUser(env,owner"), "unfollow actions must not generate follow notifications");
const likeRoute = worker.match(/if\(p==="\/api\/comments\/like"&&m==="POST"\)\{([\s\S]*?)\n\s*if\(p==="\/api\/comments\/report"/);
assert.ok(likeRoute, "comment like toggle route must exist");
assert.ok(likeRoute[1].includes("Number.isSafeInteger(cid)"), "comment like route must validate a positive safe comment id");
assert.ok(likeRoute[1].includes("await notifyUser(env,Number(c.user_id)"), "new comment likes must notify the comment author");
assert.ok(likeRoute[1].includes("Number(c.user_id)!==Number(u.id)"), "users must not be notified when liking their own comment");
assert.ok(likeRoute[1].includes("if(x){") && likeRoute[1].indexOf("if(x){") < likeRoute[1].indexOf("await notifyUser(env,Number(c.user_id)"), "unlikes must not generate notifications");
const ratingGet = worker.match(/if\(p==="\/api\/rating"&&m==="GET"\)\{([\s\S]*?)\n\s*if\(p==="\/api\/rating"&&m==="POST"/);
assert.ok(ratingGet, "rating read route must exist");
assert.ok(ratingGet[1].includes("Number.isSafeInteger(nid)"), "rating reads must validate a positive safe novel id");
assert.ok(ratingGet[1].includes("publication_status='published'"), "rating reads must only expose published novels");
const ratingPost = worker.match(/if\(p==="\/api\/rating"&&m==="POST"\)\{([\s\S]*?)\n\s*if\(p==="\/api\/admin\/community\/comments"/);
assert.ok(ratingPost, "rating write route must exist");
assert.ok(ratingPost[1].includes("Number.isInteger(rating)"), "ratings must reject fractional scores instead of silently rounding");
assert.ok(ratingPost[1].includes("rating<1||rating>10"), "ratings must stay within the 1-10 range");
assert.ok(worker.includes("CHECK(rating BETWEEN 1 AND 10)"), "fresh engagement schemas must enforce the 1-10 rating constraint");
const ratingMigration = readFileSync(new URL("../migrations/0016_ten_point_ratings.sql", import.meta.url), "utf8");
assert.ok(ratingMigration.includes("CHECK(rating BETWEEN 1 AND 10)"), "existing databases must receive the 1-10 rating constraint migration");
assert.ok(/SELECT\s+user_id,novel_id,rating,created_at,updated_at\s+FROM\s+ratings/.test(ratingMigration), "rating migration must preserve existing ratings and timestamps");
assert.ok(ratingMigration.includes("DROP TABLE ratings;") && ratingMigration.includes("ALTER TABLE ratings_ten_point RENAME TO ratings;"), "rating migration must replace the old constrained table with the ten-point table");

assert.ok(ratingPost[1].includes("whole-number rating from 1-10"), "rating validation message must describe the 1-10 whole-number scale");
assert.ok(ratingPost[1].includes("publication_status='published'"), "users may only rate published novels");
const ratingUi = readFileSync(new URL("../src/react/NovelRating.jsx", import.meta.url), "utf8");
assert.ok(ratingUi.includes("Array.from({ length: 10 }"), "reader rating UI must offer exactly ten selectable whole-number scores");
assert.ok(ratingUi.includes("Rate \u0024{value} out of 10"), "reader rating controls must announce the 1-10 scale accessibly");
assert.ok(ratingUi.includes("{average.toFixed(1)} / 10"), "reader rating summary must display averages out of ten");
assert.ok(ratingUi.includes("Your rating: {selected}/10"), "reader rating summary must display the user's score out of ten");
assert.ok(app.includes("★ \u0024{rating.toFixed(1)} / 10"), "catalog cards must label rating averages as scores out of ten");
assert.ok(app.includes('<option value="8">8+</option><option value="6">6+</option><option value="4">4+</option>'), "catalog minimum-rating filters must use ten-point thresholds");
const ratingCss = readFileSync(new URL("../public/app-17.23.0.css", import.meta.url), "utf8");
assert.ok(ratingCss.includes(".ratingStars{display:flex;flex-wrap:wrap;"), "ten rating choices must wrap safely on narrow screens");
assert.ok(ratingCss.includes("min-width:38px;min-height:38px"), "rating choices must retain comfortable touch targets");


const reactionGet = worker.match(/if\(p==="\/api\/novel-reactions"&&m==="GET"\)\{([\s\S]*?)\n\s*if\(p==="\/api\/novel-reactions"&&m==="POST"/);
assert.ok(reactionGet, "novel reaction read route must exist");
assert.ok(reactionGet[1].includes("Number.isSafeInteger(nid)"), "reaction reads must validate positive safe novel ids");
assert.ok(reactionGet[1].includes("publication_status='published'"), "reaction reads must be limited to published novels");
const reactionPost = worker.match(/if\(p==="\/api\/novel-reactions"&&m==="POST"\)\{([\s\S]*?)\n\s*if\(p==="\/api\/comments"&&m==="GET"/);
assert.ok(reactionPost, "novel reaction write route must exist");
assert.ok(reactionPost[1].includes("Number.isSafeInteger(nid)"), "reaction writes must validate positive safe novel ids");
assert.ok(reactionPost[1].includes('["love","fire","laugh","sad","clap"]'), "reaction writes must allow only the defined reaction vocabulary");
assert.ok(reactionPost[1].includes("publication_status='published'"), "users may only react to published novels");





assert.ok(app.includes("apiWithTimeout('/api/notifications',{},10000)"), "notification UI must use a bounded request");
assert.ok(app.includes("setInterval(()=>{if(location.pathname!=='/notifications')"), "notification refresh must stop after leaving the notifications page");
assert.ok(app.includes("document.visibilityState==='visible'"), "notification polling must pause while the page is hidden");
assert.ok(app.includes("},30000)"), "notification polling interval must be bounded to 30 seconds");
console.log("PASS: notification authentication, per-user isolation, bounded listing, read isolation and visibility-aware polling.");
