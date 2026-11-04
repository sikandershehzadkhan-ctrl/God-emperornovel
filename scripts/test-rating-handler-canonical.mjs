import assert from "node:assert/strict";
import fs from "node:fs";

const worker = fs.readFileSync("src/index.js", "utf8");
const post = worker.match(/if\(p===["']\/api\/rating["']&&m===["']POST["']\)/g) || [];
const get = worker.match(/if\(p===["']\/api\/rating["']&&m===["']GET["']\)/g) || [];
assert.equal(post.length, 1, "Exactly one canonical rating POST handler must exist");
assert.equal(get.length, 1, "Exactly one canonical rating GET handler must exist");
const postIndex = worker.indexOf(post[0]);
const nextHandler = worker.indexOf("\n if(p===", postIndex + post[0].length);
const handler = worker.slice(postIndex, nextHandler < 0 ? worker.length : nextHandler);
assert.ok(handler.includes("publication_status='published'"), "Rating writes must require a published novel");
assert.ok(handler.includes("rights_status IN ('original','public_domain','licensed','authorized')"), "Rating writes must enforce eligible publication rights");
assert.ok(handler.includes("rating>10"), "The canonical rating handler must enforce the ten-point upper bound");
assert.ok(handler.includes("Number.isSafeInteger(nid)") && handler.includes("Math.abs(rawRating-rating)>0.000001"), "Rating writes must reject invalid novel IDs and fractional scores");
assert.ok(handler.includes("Rating must be a whole number from 1 to 10"), "The API must return the canonical ten-point validation message");
console.log("Rating handler collision check passed: one GET, one POST, publication/rights gate, and explicit legacy-scale boundary.");
