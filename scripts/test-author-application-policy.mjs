import assert from "node:assert/strict";
import { validateAuthorApplication, validateAuthorApplicationDecision } from "../src/author-application-policy.mjs";

const valid = {
  display_name: "Sikander Writes",
  bio: "I write original fantasy and serialized fiction, with a focus on world-building and character-driven stories.",
  experience: "Independent writer",
  portfolio_url: "https://example.com/portfolio",
  sample_work: "A".repeat(350),
  preferred_formats: ["original", "web_novel", "manga"],
  rights_confirmed: true,
};
const accepted = validateAuthorApplication(valid);
assert.equal(accepted.ok, true);
assert.deepEqual(accepted.value.preferred_formats, ["original", "web_novel", "manga"]);
assert.equal(accepted.value.display_name, "Sikander Writes");

for (const input of [
  { ...valid, display_name: "x" },
  { ...valid, bio: "short" },
  { ...valid, sample_work: "too short" },
  { ...valid, preferred_formats: ["anime"] },
  { ...valid, preferred_formats: ["original", "original", "manga", "manhwa", "manhua", "webtoon"] },
  { ...valid, rights_confirmed: false },
  { ...valid, portfolio_url: "http://example.com" },
  { ...valid, portfolio_url: "javascript:alert(1)" },
]) assert.equal(validateAuthorApplication(input).ok, false);

assert.equal(validateAuthorApplicationDecision({ status: "approved" }).ok, true);
assert.equal(validateAuthorApplicationDecision({ status: "rejected", review_notes: "Please provide a clearer original sample." }).ok, true);
assert.equal(validateAuthorApplicationDecision({ status: "rejected", review_notes: "No" }).ok, false);
assert.equal(validateAuthorApplicationDecision({ status: "pending" }).ok, false);

console.log("Author application policy tests passed.");
