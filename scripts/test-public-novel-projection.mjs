import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { toPublicNovel } from "../src/public-novel.mjs";

const workerSource = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
assert.match(workerSource, /\.map\(x=>toPublicNovel\(\{\.\.\.x,status:/, "public catalog results must pass through the field-minimizing projection");
assert.match(workerSource, /\.\.\.toPublicNovel\(\{\.\.\.n,status:/, "public novel detail responses must pass through the field-minimizing projection");

const source = {
  id: 41, title: "Public story", alt_titles: "", author: "Writer",
  description: "A public description", cover_url: "/covers/public.webp",
  status: "ongoing", kind: "original", language: "English",
  publication_status: "published", rights_status: "original",
  views: 12, rating: 5, created_at: "2026-01-01", updated_at: "2026-01-02",
  chapter_count: 3, latest_chapter: 3, genres: "Fantasy", tags: "Empire Building",
  owner_user_id: 9001, source_url: "https://private-source.example/work",
  rights_evidence: "Private permission record", rights_notes: "Internal reviewer context",
  rights_verified_by: 7001, rights_verified_at: "2026-01-01T00:00:00Z",
  review_feedback: "Internal moderation feedback", reviewed_by: 7002,
  reviewed_at: "2026-01-02T00:00:00Z", author_email: "writer@example.test",
  internal_notes: "Future private database column"
};
const publicRecord = toPublicNovel(source);
for (const field of [
  "owner_user_id", "source_url", "rights_evidence", "rights_notes",
  "rights_verified_by", "rights_verified_at", "review_feedback",
  "reviewed_by", "reviewed_at", "author_email", "internal_notes"
]) assert.equal(Object.hasOwn(publicRecord, field), false, `public novel projection must omit ${field}`);
for (const field of [
  "id", "title", "alt_titles", "author", "description", "cover_url", "status",
  "kind", "language", "publication_status", "rights_status", "views", "rating",
  "created_at", "updated_at", "chapter_count", "latest_chapter", "genres", "tags"
]) assert.equal(publicRecord[field], source[field], `public novel projection must preserve reader-facing field ${field}`);
assert.equal(source.owner_user_id, 9001, "projection must not mutate the database result");
assert.deepEqual(toPublicNovel(null), {});
assert.deepEqual(toPublicNovel([]), {});
console.log("Public novel API allowlist and route-wiring tests passed.");
