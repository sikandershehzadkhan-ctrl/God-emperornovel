import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const [source, bundle] = await Promise.all([
  readFile("public/app.js", "utf8"),
  readFile("public/app-17.23.0.js", "utf8")
]);
assert.equal(source, bundle, "Served application bundle must match editable source.");
const helperStart = source.indexOf("function catalogRatingLabel(value){");
const helperEnd = source.indexOf("\n", helperStart);
assert.ok(helperStart >= 0 && helperEnd > helperStart, "Catalog rating formatter must exist.");
const format = vm.runInNewContext("(" + source.slice(helperStart, helperEnd) + ")");
for (const [input, expected] of [[1,1],[8,8],[8.4,8],[8.5,9],[10,10],["7",7]]) {
  assert.equal(format(input), expected);
}
for (const input of [0,-1,10.1,11,NaN,Infinity,-Infinity,"unknown",null,undefined]) {
  assert.equal(format(input), null, "Invalid or absent ratings must not render: " + String(input));
}
const cardStart = source.indexOf("function catalogCard(n)");
const cardEnd = source.indexOf("function applyImperialTheme", cardStart);
assert.ok(cardStart >= 0 && cardEnd > cardStart);
const card = source.slice(cardStart, cardEnd);
assert.ok(card.includes("rating!==null?"), "Catalog cards must omit missing and invalid ratings.");
assert.ok(card.includes("${rating} / 10"), "Catalog cards must display whole-number ratings.");
assert.ok(!card.includes("toFixed(1)"), "Catalog cards must not force a decimal rating.");
console.log("PASS: catalog ratings display as valid whole numbers from 1 to 10; missing/invalid ratings stay hidden and served bundle matches source.");
