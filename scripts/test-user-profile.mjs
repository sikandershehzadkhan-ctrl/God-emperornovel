import assert from "node:assert/strict";
import fs from "node:fs";
import { validateUserProfile } from "../src/user-profile-policy.mjs";

const valid = {
  display_name: "Sikander Reader",
  bio: "Stories, worlds and thoughtful reading.",
  avatar_url: "/media/avatar.webp",
  website_url: "https://example.com/",
  location: "Islamabad",
  profile_visibility: "public",
  show_reading_stats: true
};
const accepted = validateUserProfile(valid);
assert.equal(accepted.ok, true);
assert.equal(accepted.value.show_reading_stats, 1);
assert.equal(accepted.value.profile_visibility, "public");
assert.equal(validateUserProfile({ ...valid, avatar_url: "javascript:alert(1)" }).ok, false);
assert.equal(validateUserProfile({ ...valid, avatar_url: "http://example.com/a.png" }).ok, false);
assert.equal(validateUserProfile({ ...valid, website_url: "http://example.com" }).ok, false);
assert.equal(validateUserProfile({ ...valid, display_name: "<script>" }).ok, true, "Text is escaped at rendering, not silently rewritten.");
assert.equal(validateUserProfile({ ...valid, bio: "x".repeat(501) }).ok, false);
assert.equal(validateUserProfile({ ...valid, location: "x".repeat(81) }).ok, false);
assert.equal(validateUserProfile({ ...valid, profile_visibility: "friends" }).ok, false);
assert.equal(validateUserProfile({ ...valid, show_reading_stats: "true" }).ok, false);
assert.equal(validateUserProfile({ ...valid, role: "admin" }).ok, false);
assert.equal(validateUserProfile({ ...valid, avatar_url: "//evil.example/image.png" }).ok, false);
assert.equal(validateUserProfile({ ...valid, avatar_url: "/images/../private.png" }).ok, false);
assert.equal(validateUserProfile(null).ok, false);

const migration = fs.readFileSync("migrations/0012_user_profiles.sql", "utf8");
assert.ok(migration.includes("profile_visibility TEXT NOT NULL DEFAULT 'private'"), "Profiles default to private.");
assert.ok(migration.includes("show_reading_stats INTEGER NOT NULL DEFAULT 0"), "Reading statistics are opt-in.");
for (const column of ["display_name", "bio", "avatar_url", "website_url", "location", "profile_visibility", "show_reading_stats", "profile_updated_at"]) {
  assert.match(migration, new RegExp("ADD COLUMN " + column));
}
const worker = fs.readFileSync("src/index.js", "utf8");
assert.match(worker, /p==="\/api\/profile"&&m==="PUT"/);
assert.match(worker, /\/api\/public-profile\//);
const publicStart = worker.indexOf('if(p.startsWith("/api/public-profile/")');
const publicEnd = worker.indexOf('if(p==="/api/author/applications/me"', publicStart);
assert.ok(publicStart >= 0 && publicEnd > publicStart, "Public profile API route must be present.");
const publicProjection = worker.slice(publicStart, publicEnd);
assert.ok(publicProjection.includes("profile_visibility='public'"), "Private profiles must not resolve publicly.");
assert.ok(publicProjection.includes("show_reading_stats"), "Reading statistics must respect owner consent.");
assert.ok(!publicProjection.includes("email"), "Public profile projection must never expose email.");
assert.ok(!publicProjection.includes("tickets"), "Public profile projection must never expose Crown balances.");
assert.ok(!publicProjection.includes("password"), "Public profile projection must never expose authentication data.");
assert.ok(publicProjection.includes("rights_status IN ('original','public_domain','licensed','authorized')"), "Author works must be rights-eligible.");
const app = fs.readFileSync("public/app.js", "utf8");
assert.match(app, /async function profilePage\(/);
assert.match(app, /async function publicProfile\(/);
assert.match(app, /p==='\/profile'/);
assert.match(app, /\/u\//);
assert.equal(app, fs.readFileSync("public/app-17.23.0.js", "utf8"), "Source and served app bundles must remain byte-identical.");
assert.match(app, /async function authorPublic\\(/);
assert.ok(app.includes("/api/public-profile/"), "Author pages use the privacy-gated public profile endpoint.");
assert.ok(app.includes("View full public profile"), "Author pages link to the public account profile.");
console.log("User profile validation, privacy, route, and bundle checks passed.");
