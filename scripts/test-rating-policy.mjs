import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseNovelRatingInput } from "../src/rating-policy.mjs";

for (const input of [
  {}, { novel_id: 1 }, { novel_id: 0, rating: 5 }, { novel_id: -1, rating: 5 },
  { novel_id: 1.5, rating: 5 }, { novel_id: Number.MAX_SAFE_INTEGER + 1, rating: 5 },
  { novel_id: 1, rating: 0 }, { novel_id: 1, rating: -1 }, { novel_id: 1, rating: 6 },
  { novel_id: 1, rating: 2.5 }, { novel_id: 1, rating: "2.5" },
  { novel_id: 1, rating: "not-a-number" }, { novel_id: 1, rating: true },
  { novel_id: 1, rating: null }, { novel_id: 1, rating: "9007199254740992" }
]) {
  assert.equal(parseNovelRatingInput(input).ok, false, JSON.stringify(input));
}

for (const rating of [1, 2, 3, 4, 5, "1", "5"]) {
  assert.deepEqual(parseNovelRatingInput({ novel_id: 7, rating }), {
    ok: true, novelId: 7, rating: Number(rating)
  });
}
assert.deepEqual(parseNovelRatingInput({ novel_id: "7", rating: 4 }), {
  ok: true, novelId: 7, rating: 4
});

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
assert.match(worker, /parseNovelRatingInput/);
assert.match(worker, /if\(!parsed\.ok\)return json\(\{error:parsed\.error\},400\)/);
assert.doesNotMatch(worker, /rating=Math\.round\(Number\(b\.rating\)\)/);
console.log("PASS: ratings require a valid positive safe-integer novel ID and an integer star value from 1 through 5.");
