import assert from "node:assert/strict";
import { parsePositiveSafeInteger } from "../src/published-engagement-policy.mjs";
for (const value of [1, "1", 2, "42"]) assert.equal(parsePositiveSafeInteger(value), Number(value));
for (const value of [0, -1, "0", "1.5", 1.5, NaN, Infinity, "abc", null, undefined, {}, Number.MAX_SAFE_INTEGER + 1]) assert.equal(parsePositiveSafeInteger(value), null);
console.log("Published engagement identifier policy tests passed.");
