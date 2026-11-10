import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("public/app.js", "utf8");
const served = fs.readFileSync("public/app-17.23.0.js", "utf8");
const worker = fs.readFileSync("src/index.js", "utf8");
const component = fs.readFileSync("src/react/NovelRating.jsx", "utf8");
const styles = fs.readFileSync("public/imperial-design-system.css", "utf8");
const migration = fs.readFileSync("migrations/0012_rating_scale_10.sql", "utf8");
const deploy = fs.readFileSync(".github/workflows/deploy.yml", "utf8");

assert.equal(source, served, "Editable app source and served runtime must remain identical");
const match = source.match(/function ratingText\\(value\\)\\s*\\{[\\s\\S]*?\\}/);
assert.ok(match, "A shared truthful rating formatter must exist");
const ratingText = vm.runInNewContext(match[0] + "; ratingText");
const cases = [
  [10, "10/10"], [9.6, "10/10"], [8.4, "8/10"], ["2.2", "2/10"],
  [1, "1/10"], [null, "Not rated"], [undefined, "Not rated"], [0, "Not rated"],
  [-1, "Not rated"], [11, "Not rated"], ["invalid", "Not rated"], [NaN, "Not rated"]
];
for (const [value, expected] of cases) assert.equal(ratingText(value), expected, "Unexpected display for " + String(value));

assert.ok((source.match(/ratingText\\(n\\.rating\\)/g) || []).length >= 6, "Novel cards and public rating surfaces must use the shared formatter");
assert.ok(source.includes("ratingText(x.rating)"), "Author leaderboard ratings must use the shared formatter");
assert.ok(!source.includes("Number(x.rating||0).toFixed(1)"), "Author leaderboards must not fabricate fractional ratings");
assert.ok(!source.includes("Number(n.rating||0).toFixed(1)"), "Missing ratings must never be rendered as fabricated 0.0 values");

assert.match(worker, /CHECK\\(rating BETWEEN 1 AND 10 AND rating=CAST\\(rating AS INTEGER\\)\\)/, "New ratings must be constrained to whole numbers 1–10");
assert.match(worker, /typeof rating!==\\"number\\"\\|\\|!Number\\.isSafeInteger\\(rating\\)\\|\\|rating<1\\|\\|rating>10/, "Rating API must reject strings, fractions and values outside 1–10");
assert.ok(!worker.includes("rating>5") && !worker.includes("Rating must be 1-5"), "No legacy 1–5 API guard may remain");
assert.equal((worker.match(/if\\(p===\\"\\/api\\/rating\\"&&m===\\"POST\\"\\)/g) || []).length, 1, "Exactly one canonical rating POST handler must exist");
assert.ok(worker.includes("Math.min(10,minRating)"), "Catalog minimum-rating filter must support the 10-point scale");

assert.match(component, /\\[1, 2, 3, 4, 5, 6, 7, 8, 9, 10\\]\\.map/, "Rating control must expose ten choices");
assert.ok(component.includes("Rate \\u0024{value} out of 10"), "Rating controls must announce the 10-point scale");
assert.ok(component.includes('count > 0 ? `${Math.round(average)} / 10` : "Not rated"'), "Unrated novels must not display 0/10");
assert.ok(component.includes("Be the first to rate"), "An unrated novel should invite its first rating");

assert.match(styles, /\\.ratingIsland \\.ratingStars\\s*\\{[^}]*flex-wrap: wrap/s, "Ten rating controls must wrap");
assert.match(styles, /\\.ratingIsland \\.ratingStar\\s*\\{[^}]*min-width: 44px;[^}]*min-height: 44px/s, "Rating controls must meet 44px touch targets");
assert.match(migration, /rating\\*2/, "Migration must preserve legacy relative rating positions");
assert.match(migration, /CHECK\\(rating BETWEEN 1 AND 10 AND rating=CAST\\(rating AS INTEGER\\)\\)/, "Migrated table must enforce integer ratings 1–10");
assert.ok(deploy.includes("rating schema") && deploy.includes("0012_rating_scale_10.sql"), "Production release must preflight and apply the rating migration before Worker deployment");

console.log("Rating scale regression passed: 1–10 API, UI, canonical styling, single route, truthful labels, and governed migration.");
