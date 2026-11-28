import assert from "node:assert/strict";
import {
  IMPERIAL_FOUNDER_RANK,
  IMPERIAL_RANKS,
  getImperialProgressionRank,
  getImperialRankProgress,
} from "../src/imperial-ranks.mjs";

assert.equal(IMPERIAL_RANKS.length, 50, "catalogue must contain exactly 50 ranks");
assert.equal(IMPERIAL_RANKS[0].id, 1);
assert.equal(IMPERIAL_RANKS[0].minXp, 0);
assert.equal(IMPERIAL_RANKS[48].id, 49);
assert.equal(IMPERIAL_RANKS[48].name, "Imperial Ultimate Sovereign");
assert.equal(IMPERIAL_FOUNDER_RANK.id, 50);
assert.equal(IMPERIAL_FOUNDER_RANK.name, "Imperial God Emperor");
assert.equal(IMPERIAL_FOUNDER_RANK.founderOnly, true);
assert.equal(IMPERIAL_FOUNDER_RANK.minXp, null);

for (let i = 1; i < 49; i += 1) {
  assert.ok(IMPERIAL_RANKS[i].minXp > IMPERIAL_RANKS[i - 1].minXp,
    "earned rank XP thresholds must strictly increase");
  assert.equal(IMPERIAL_RANKS[i].id, i + 1);
  assert.equal(IMPERIAL_RANKS[i].founderOnly, false);
}

assert.equal(getImperialProgressionRank(0).id, 1);
assert.equal(getImperialProgressionRank(99).id, 1);
assert.equal(getImperialProgressionRank(100).id, 2);
assert.equal(getImperialProgressionRank(1899999).id, 48);
assert.equal(getImperialProgressionRank(1900000).id, 49);
assert.equal(getImperialProgressionRank(Number.MAX_SAFE_INTEGER).id, 49);
assert.equal(getImperialProgressionRank(-500).id, 1);
assert.equal(getImperialProgressionRank("not-a-number").id, 1);
assert.equal(getImperialProgressionRank(Infinity).id, 1);

const progress = getImperialRankProgress(150);
assert.equal(progress.currentRank.id, 2);
assert.equal(progress.nextRank.id, 3);
assert.equal(progress.xpToNextRank, 100);
assert.equal(progress.progressPercent, 40);
assert.equal(getImperialRankProgress(1900000).atEarnedCap, true);
assert.equal(getImperialRankProgress(1900000).nextRank, null);

console.log("Imperial rank catalogue tests passed (49 earned ranks + founder-only rank 50).");
