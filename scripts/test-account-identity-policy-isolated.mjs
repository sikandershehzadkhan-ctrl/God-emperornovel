import assert from "node:assert/strict";
import { validateUsernameChange } from "../src/identity/account-identity-policy.mjs";
assert.deepEqual(validateUsernameChange({username:"Reader_24"},"oldname"),{ok:true,value:"Reader_24"});
for(const username of ["ab","a".repeat(25),"two words","admin","API","../root","user-name"]) assert.equal(validateUsernameChange({username},"oldname").ok,false);
assert.equal(validateUsernameChange({username:"OldName"},"oldname").ok,false);
assert.equal(validateUsernameChange({username:["admin"]},"oldname").ok,false);
assert.equal(validateUsernameChange(null,"oldname").ok,false);
console.log("PASS: username format, reserved-name, normalization and unchanged-name policy.");
