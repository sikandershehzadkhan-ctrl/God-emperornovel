import assert from "node:assert/strict";
import fs from "node:fs";
import { defaultAccountPreferences, validateAccountPreferences } from "../src/account-preferences-policy.mjs";

const defaults = defaultAccountPreferences();
assert.deepEqual(defaults, {
  site_theme: "light",
  reader_theme: "dark",
  font_size: 18,
  line_height: 1.85,
  text_width: 600,
  reduced_motion: false,
  high_contrast: false,
  compact_cards: false
});
const valid = validateAccountPreferences({
  site_theme: "light",
  reader_theme: "sepia",
  font_size: 22,
  line_height: 2,
  text_width: 680,
  reduced_motion: true,
  high_contrast: true,
  compact_cards: false
});
assert.equal(valid.ok, true);
assert.equal(validateAccountPreferences(null).ok, false);
assert.equal(validateAccountPreferences({ ...defaults, role: "admin" }).ok, false);
assert.equal(validateAccountPreferences({ ...defaults, site_theme: "neon" }).ok, false);
assert.equal(validateAccountPreferences({ ...defaults, reader_theme: "unknown" }).ok, false);
assert.equal(validateAccountPreferences({ ...defaults, font_size: 31 }).ok, false);
assert.equal(validateAccountPreferences({ ...defaults, font_size: 18.5 }).ok, false);
assert.equal(validateAccountPreferences({ ...defaults, line_height: 1.7 }).ok, false);
assert.equal(validateAccountPreferences({ ...defaults, text_width: 900 }).ok, false);
assert.equal(validateAccountPreferences({ ...defaults, reduced_motion: "true" }).ok, false);

const migration = fs.readFileSync("migrations/0018_account_preferences.sql", "utf8");
assert.match(migration, /preferences_json TEXT NOT NULL DEFAULT '\{\}'/);

const worker = fs.readFileSync("src/index.js", "utf8");
const getStart = worker.indexOf('if(p==="/api/account/preferences"&&m==="GET")');
const putStart = worker.indexOf('if(p==="/api/account/preferences"&&m==="PUT")');
const profileStart = worker.indexOf('if(p==="/api/profile"&&m==="GET")');
assert.ok(getStart >= 0 && putStart > getStart && profileStart > putStart, "Preference API routes must be registered before profile routes.");
const getRoute = worker.slice(getStart, putStart);
for (const guard of ["need(u)", "preferences_json", "validateAccountPreferences", "defaultAccountPreferences()", "has_saved"]) {
  assert.ok(getRoute.includes(guard), "Preference GET route missing: " + guard);
}
const putRoute = worker.slice(putStart, profileStart);
for (const guard of ["need(u)", "origin!==url.origin", "sec-fetch-site", 'consumeAuthRateLimit(env,"account-preferences"', "validateAccountPreferences", "JSON.stringify(checked.value)", 'audit(env,u,"account.preferences_updated"']) {
  assert.ok(putRoute.includes(guard), "Preference PUT route missing: " + guard);
}

const app = fs.readFileSync("public/app.js", "utf8");
const versioned = fs.readFileSync("public/app-17.24.0.js", "utf8");
assert.equal(app, versioned, "Source and active served bundles must remain byte-identical.");
for (const marker of ["api('/api/account/preferences')", "Preferences synced to your account.", "Your device preferences are now synced to your account.", "Reset appearance and reader preferences on this device and your account?"]) {
  assert.ok(app.includes(marker), "Settings UI missing account sync behavior: " + marker);
}
console.log("Account preference validation, owner-scoped sync API, migration, and UI checks passed.");
