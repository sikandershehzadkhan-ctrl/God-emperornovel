import assert from "node:assert/strict";
import { validateUserProfile } from "../src/identity/user-profile-policy.mjs";
const base={display_name:"Reader Name",bio:"Stories",avatar_url:"/media/avatar.webp",website_url:"https://example.com",location:"Islamabad",profile_visibility:"private",show_reading_stats:false};
assert.equal(validateUserProfile(base).ok,true);
for(const value of [{...base,avatar_url:"javascript:alert(1)"},{...base,avatar_url:"//evil.test/a"},{...base,website_url:"http://example.com"},{...base,bio:"x".repeat(501)},{...base,location:"x".repeat(81)},{...base,profile_visibility:"friends"},{...base,show_reading_stats:"true"},{...base,role:"admin"},null]) assert.equal(validateUserProfile(value).ok,false);
assert.equal(validateUserProfile({...base,display_name:"<script>"}).ok,true);
console.log("PASS: profile validation, safe URLs, bounded fields, private default inputs and role-field rejection.");
