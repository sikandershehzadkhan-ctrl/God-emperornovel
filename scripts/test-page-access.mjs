import assert from "node:assert/strict";
import { protectedPageAccess } from "../src/page-access.mjs";
const normal={id:1,role:"user"}, author={id:2,role:"author"}, admin={id:3,role:"admin"};
for (const path of ["/admin","/admin.html"]) {
  assert.equal(protectedPageAccess(path,null).status,401);
  assert.equal(protectedPageAccess(path,normal).status,403);
  assert.equal(protectedPageAccess(path,author).status,403);
  assert.equal(protectedPageAccess(path,admin).allowed,true);
}
for (const path of ["/author","/author.html","/author/studio","/author/studio/projects"]) {
  assert.equal(protectedPageAccess(path,null).status,401);
  assert.equal(protectedPageAccess(path,normal).status,403);
  assert.equal(protectedPageAccess(path,author).allowed,true);
  assert.equal(protectedPageAccess(path,admin).allowed,true);
}
assert.equal(protectedPageAccess("/author/some-public-creator",normal).allowed,true);
assert.equal(protectedPageAccess("/tickets",normal).allowed,true);
console.log("PASS: Admin and Author Studio HTML routes enforce server-side roles; public creator pages and the personal Crown wallet remain accessible.");
