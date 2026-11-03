import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildCatalogSearchPredicate, buildCatalogSearchOrder } from "../src/catalog-search-policy.mjs";

const empty = buildCatalogSearchPredicate([]);
assert.equal(empty.sql, "");
assert.deepEqual(empty.values, []);

const combined = buildCatalogSearchPredicate(["Fantasy", "system"]);
assert.equal(combined.sql.split("EXISTS (").length - 1, 4);
assert.equal(combined.sql.split("LOWER(g.name)").length - 1, 2);
assert.equal(combined.sql.split("LOWER(t.name)").length - 1, 2);
assert.equal(combined.values.length, 16);
assert.deepEqual(combined.values.slice(0, 8), Array(8).fill("%fantasy%"));
assert.deepEqual(combined.values.slice(8), Array(8).fill("%system%"));
assert.ok(combined.sql.includes("ng.novel_id = n.id"));
assert.ok(combined.sql.includes("nt.novel_id = n.id"));

const escaped = buildCatalogSearchPredicate(["50%_" + String.fromCharCode(92)]);
const expectedPattern = "%" + "50" + "\\%" + "\\_" + "\\\\" + "%";
assert.equal(escaped.values[0], expectedPattern);
assert.equal(escaped.values.length, 8);
assert.ok(!escaped.sql.includes("50%_"));

const bounded = buildCatalogSearchPredicate(["one", "two", "three", "four", "five", "six", "seven", "eight", "ignored"]);
assert.equal(bounded.values.length, 64);

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
assert.ok(worker.includes('import { buildCatalogSearchPredicate, buildCatalogSearchOrder } from "./catalog-search-policy.mjs";'));
assert.ok(worker.includes('const search=buildCatalogSearchPredicate(searchTerms);sql+=" AND "+search.sql;a.push(...search.values)'));
assert.ok(worker.includes("FROM novels n WHERE n.publication_status='published'"), "Search must retain the published-content visibility boundary.");

console.log("PASS: catalog search matches title/author/description/aliases and genre/tag taxonomy with parameterized, escaped, bounded terms and preserves the published-content boundary.");


const relevance = buildCatalogSearchOrder("Fantasy_50%");
assert.equal(relevance.values.length, 12);
assert.ok(relevance.sql.indexOf("LOWER(n.title)=?") < relevance.sql.indexOf("LOWER(g.name)=?"));
assert.ok(relevance.sql.includes("THEN 4"));
assert.ok(relevance.sql.includes("THEN 5"));
assert.ok(relevance.sql.includes("THEN 6"));
assert.ok(relevance.sql.includes("THEN 7"));
assert.ok(relevance.sql.includes("ELSE 8 END"));
assert.deepEqual(relevance.values, [
  "fantasy_50%", "fantasy\\_50\\%", "fantasy_50%", "%fantasy\\_50\\%",
  "fantasy_50%", "fantasy_50%", "fantasy_50%", "fantasy_50%",
  "fantasy\\_50\\%", "fantasy\\_50\\%", "fantasy\\_50\\%", "fantasy\\_50\\%"
]);
assert.deepEqual(buildCatalogSearchOrder("  "), { sql: "", values: [] });
assert.ok(worker.includes('import { buildCatalogSearchPredicate, buildCatalogSearchOrder } from "./catalog-search-policy.mjs";'));
assert.ok(worker.includes('const relevance=buildCatalogSearchOrder(term);order=relevance.sql+","+selectedOrder;a.push(...relevance.values)'));

console.log("PASS: catalog relevance ranks exact/prefix genre and tag matches after title/author matches using escaped parameters and pagination-safe EXISTS clauses.");
