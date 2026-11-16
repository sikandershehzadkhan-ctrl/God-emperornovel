import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("public/app.js", "utf8");
const served = fs.readFileSync("public/app-17.23.0.js", "utf8");
const worker = fs.readFileSync("src/index.js", "utf8");
const component = fs.readFileSync("src/react/NovelRating.jsx", "utf8");
const styles = fs.readFileSync("public/imperial-design-system.css", "utf8");

assert.equal(source, served, "Editable app source and served runtime must remain identical");
const match = source.match(/function ratingText\(value\)\s*\{[\s\S]*?\}/);
assert.ok(match, "A shared truthful rating formatter must exist");
const ratingText = vm.runInNewContext(match[0] + "; ratingText");
const cases = [
  [10, "10/10"], [9.6, "10/10"], [8.4, "8/10"], ["2.2", "2/10"],
  [1, "1/10"], [null, "Not rated"], [undefined, "Not rated"], [0, "Not rated"],
  [-1, "Not rated"], [11, "Not rated"], ["invalid", "Not rated"], [NaN, "Not rated"]
];
for (const [value, expected] of cases) assert.equal(ratingText(value), expected, "Unexpected display for " + String(value));

assert.ok((source.match(/ratingText\(n\.rating\)/g) || []).length >= 6, "Public novel rating surfaces must use the shared formatter");
assert.ok(source.includes("ratingText(x.rating)"), "Library and author leaderboard ratings must use the shared formatter");
assert.ok(!source.includes("Number(x.rating||0).toFixed(1)") && !source.includes("Number(n.rating||0).toFixed(1)"), "Ratings must not be rendered as fabricated fractional values");
assert.ok(source.includes('<option value="8">8+</option><option value="6">6+</option><option value="4">4+</option>'), "Catalog rating thresholds must use the 1–10 scale");
assert.ok(!source.includes('<option value="3">3+</option>'), "Legacy 1–5 catalog thresholds must be removed");

assert.ok(worker.includes("CHECK(rating BETWEEN 1 AND 10 AND rating=CAST(rating AS INTEGER))"), "Runtime rating schema must enforce integer values from 1–10");
assert.ok(worker.includes('typeof rating!=="number"||!Number.isSafeInteger(rating)||rating<1||rating>10'), "Rating API must reject strings, fractions and out-of-range values");
assert.ok(!worker.includes("rating>5") && !worker.includes("Rating must be 1-5"), "No legacy 1–5 API guard may remain");
assert.equal((worker.match(/if\(p==="\/api\/rating"&&m==="POST"\)/g) || []).length, 1, "Exactly one canonical rating POST handler must remain");
assert.ok(worker.includes("Math.min(10,minRating)"), "Catalog minimum-rating filter must support 10");

assert.ok(component.includes("[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map"), "Rating control must expose ten choices");
assert.ok(component.includes("out of 10"), "Rating controls must announce the 10-point scale");
assert.ok(component.includes("Not rated") && component.includes("Be the first to rate"), "Unrated novels must show a truthful empty state");
assert.ok(styles.includes(".ratingIsland .ratingStars") && styles.includes("flex-wrap: wrap"), "Ten rating controls must wrap on narrow screens");
assert.ok(styles.includes("min-width: 44px;") && styles.includes("min-height: 44px;"), "Rating controls must meet 44px touch targets");

console.log("Rating scale regression passed: 1–10 UI, API, catalog filters, integer validation, rights guard, duplicate-route prevention, and source/served parity.");
