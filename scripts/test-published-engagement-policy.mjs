import assert from "node:assert/strict";
import { parsePositiveSafeInteger } from "../src/published-engagement-policy.mjs";

for (const value of [1, "1", 2, "42", Number.MAX_SAFE_INTEGER, String(Number.MAX_SAFE_INTEGER)]) {
  assert.equal(parsePositiveSafeInteger(value), Number(value));
}
for (const value of [0, -1, "0", "1.5", " 1 ", "1e2", "0x10", 1.5, NaN, Infinity, "abc", null, undefined, true, false, {}, [], Number.MAX_SAFE_INTEGER + 1]) {
  assert.equal(parsePositiveSafeInteger(value), null, String(value));
}
console.log("PASS: engagement identifiers accept only positive safe integers and digit-only strings.");
