import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const passwordCheck = source.indexOf('if(!await verifyPassword(password,x.password_hash))');
const bannedCheck = source.indexOf('if(x.banned)return json({error:"This account is unavailable.');
const sessionIssue = source.indexOf('INSERT INTO sessions(token_hash,user_id,expires_at)');
assert.notEqual(passwordCheck, -1, "login password verification must exist");
assert.notEqual(bannedCheck, -1, "login must reject banned accounts");
assert.notEqual(sessionIssue, -1, "login session issuance must exist");
assert.ok(passwordCheck < bannedCheck, "password must be verified before account status response");
assert.ok(bannedCheck < sessionIssue, "banned-account rejection must happen before session issuance");
assert.ok(source.includes("const cookies=h=>"), "cookie parser must exist");
assert.ok(source.includes("try{decoded=decodeURIComponent(value)}catch"), "malformed cookie percent-encoding must not throw out of request handling");
console.log("Authentication input-hardening regression checks passed.");
