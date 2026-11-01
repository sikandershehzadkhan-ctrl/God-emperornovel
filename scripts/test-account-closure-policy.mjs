import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const source=readFileSync(new URL("../src/index.js",import.meta.url),"utf8");
const migration=readFileSync(new URL("../migrations/0019_account_closure_requests.sql",import.meta.url),"utf8");
const app=readFileSync(new URL("../public/app.js",import.meta.url),"utf8");
const requestStart=source.indexOf('if(p==="/api/account/closure-request"&&m==="POST")');
const cancelStart=source.indexOf('if(p==="/api/account/closure-cancel"&&m==="POST")');
const exportStart=source.indexOf('if(p==="/api/privacy/export"&&m==="GET")');
assert.ok(requestStart>=0&&cancelStart>requestStart&&exportStart>cancelStart,"closure request and cancellation routes must be registered");
const requestRoute=source.slice(requestStart,cancelStart);
const cancelRoute=source.slice(cancelStart,exportStart);
for(const [fragment,reason] of [
 ['need(u)',"closure request must require authentication"],
 ['consumeAuthRateLimit(env,"account-closure-user",String(u.id),3,86400)',"closure request must be rate limited per account"],
 ['verifyPassword(password,account.password_hash)',"closure request must verify the current password"],
 ['14*86400',"closure request must grant a 14-day grace period"],
 ["status='pending'","only one active pending request may be reused"],
 ['INSERT INTO audit_logs',"closure request must be audited"]
])assert.ok(requestRoute.includes(fragment),reason);
for(const [fragment,reason] of [
 ['need(u)',"cancellation must require authentication"],
 ["status='cancelled'","cancellation must transition the request to cancelled"],
 ['grace_until>?',"cancellation must only work during the grace period"],
 ["'account_closure_cancelled'","cancellation must be audited"]
])assert.ok(cancelRoute.includes(fragment),reason);
assert.ok(migration.includes("CREATE TABLE IF NOT EXISTS account_closure_requests"),"closure migration must create the request table");
assert.ok(migration.includes("WHERE status='pending'"),"database must enforce one pending request per account");
assert.ok(!requestRoute.includes("DELETE FROM users")&&!cancelRoute.includes("DELETE FROM users"),"request and cancellation routes must never erase accounts");
assert.ok(app.includes("closureRequestForm")&&app.includes("closureCancelButton")&&app.includes("/api/privacy/export"),"account UI must expose export, closure request, and cancellation controls");
console.log("PASS: account closure is authenticated, password-confirmed, rate-limited, reversible during grace, audited, and non-destructive.");
