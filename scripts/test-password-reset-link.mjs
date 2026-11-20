import assert from "node:assert/strict";
import { createPasswordResetLink } from "../src/password-reset-link.mjs";

const token = "A".repeat(43);
const link = createPasswordResetLink(token, "https://imperialnovel.example");
const parsed = new URL(link);
assert.equal(parsed.origin, "https://imperialnovel.example");
assert.equal(parsed.pathname, "/reset-password");
assert.equal(parsed.search, "");
assert.equal(parsed.hash, "#token=" + token);
assert.equal(link.includes("?"), false);
assert.equal(createPasswordResetLink(token, "https://imperialnovel.example"), link);

for (const origin of [
  "",
  "http://imperialnovel.example",
  "https://user:pass@imperialnovel.example",
  "https://imperialnovel.example/path",
  "https://imperialnovel.example?next=evil",
  "https://imperialnovel.example#fragment",
  "https://imperialnovel.example/"
]) {
  assert.throws(() => createPasswordResetLink(token, origin), /origin/);
}
assert.throws(() => createPasswordResetLink("bad", "https://imperialnovel.example"), /token/);
console.log("PASS: reset links require a canonical HTTPS origin and keep tokens in URL fragments.");
