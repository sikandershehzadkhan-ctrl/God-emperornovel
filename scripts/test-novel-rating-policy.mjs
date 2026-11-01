import assert from "node:assert/strict";
import fs from "node:fs";
import { parseNovelRating } from "../src/rating-policy.mjs";

for (const value of [1, 2, 5, 9, 10]) {
  assert.deepEqual(parseNovelRating(value), { ok: true, value });
}

for (const value of [
  0, -1, 11, 1.5, 9.99, NaN, Infinity, -Infinity,
  Number.MAX_SAFE_INTEGER + 1, true, false, null, undefined, "1", "5", "10", ""
]) {
  assert.equal(parseNovelRating(value).ok, false, `Expected rating ${String(value)} to be rejected`);
}

const worker = fs.readFileSync("src/index.js", "utf8");
const island = fs.readFileSync("src/react/NovelRating.jsx", "utf8");
const migration = fs.readFileSync("migrations/0017_ten_point_ratings.sql", "utf8");

assert.ok(worker.includes('import { parseNovelRating } from "./rating-policy.mjs";'));
assert.ok(worker.includes("parsedRating=parseNovelRating(b.rating)"));
assert.ok(!worker.includes('Rating must be 1-5'), "No legacy 1–5 API contract may remain.");
assert.ok(island.includes("Array.from({ length: 10 }"), "Reader UI must offer ten rating choices.");
assert.ok(island.includes("Rate ${value} out of 10"), "Rating controls must announce the 1–10 scale.");
assert.ok(island.includes("{average.toFixed(1)} / 10"), "Rating summary must display /10.");
assert.ok(migration.includes("CHECK(rating BETWEEN 1 AND 10)"), "D1 must enforce whole-number ratings from 1 through 10.");

console.log("Novel rating policy, API integration, UI scale and D1 constraint checks passed.");
