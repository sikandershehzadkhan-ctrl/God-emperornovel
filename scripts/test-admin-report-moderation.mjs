import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const getBlock = source.slice(source.indexOf('if(p==="/api/admin/comment-reports"'), source.indexOf('if(p==="/api/admin/tickets"'));
assert.ok(getBlock.includes('const e=admin(u);if(e)return e'), "comment report queue must be admin-gated");
assert.ok(getBlock.includes("LEFT JOIN users u ON u.id=cr.user_id"), "queue must identify the reporter");
assert.ok(getBlock.includes("LEFT JOIN comments c ON c.id=cr.comment_id"), "queue must include reported comment context");
assert.ok(getBlock.includes("LEFT JOIN novels n ON n.id=c.novel_id"), "queue must include parent novel context");
assert.ok(getBlock.includes("LIMIT 200"), "queue must be bounded");
assert.ok(getBlock.includes("['open','reviewing','resolved','dismissed']"), "moderation states must be allowlisted");
assert.ok(getBlock.includes("UPDATE comment_reports SET status=? WHERE id=?"), "moderation must update only the selected report");
assert.ok(getBlock.includes("comment_report_status_changed"), "moderation must create an audit event");
assert.ok(getBlock.includes("Report not found"), "missing reports must return not found");
const generic = source.slice(source.indexOf('if(p==="/api/admin/reports"'), source.indexOf('if(p==="/api/admin/comment-reports"'));
assert.ok(generic.includes("Number(changed?.meta?.changes??changed?.changes??0)!==1"), "generic report status must verify an existing row");
assert.ok(generic.includes("report_status_changed"), "generic report status must be audited");
console.log("Admin report moderation policy checks passed.");
