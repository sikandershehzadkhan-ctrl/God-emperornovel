import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const app=readFileSync(new URL("../public/app.js",import.meta.url),"utf8");
const accountStart=app.indexOf("async function account()");
const accountEnd=app.indexOf("async function library(",accountStart);
assert.ok(accountStart>=0&&accountEnd>accountStart,"Account page must exist");
const account=app.slice(accountStart,accountEnd);
for(const fragment of [
  "Account deletion request",
  "30-day cooling-off period",
  'api(\'/api/me/deletion-request\'',
  'api(\'/api/me/deletion-request/cancel\'',
  'autocomplete="current-password"',
  "review_required",
  "Your content remains intact",
  "form.onsubmit",
  "cancel.onclick"
]) assert.ok(account.includes(fragment),`Account deletion UI missing: ${fragment}`);
console.log("PASS: account page exposes status, password re-authentication, request, and cancellation controls.");
