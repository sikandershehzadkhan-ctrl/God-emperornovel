import assert from "node:assert/strict";
import { canApproveCurrentDisposition } from "../src/account-deletion-disposition-approval-policy.mjs";

const valid={
 actorId:30,subjectId:10,proposerId:20,
 reviewerRoles:["deletion_second_approver"],activeAssignment:true,
 reviewState:"review_in_progress",reviewVersion:8,planBaseReviewVersion:7,
 planId:42,latestPlanId:42,planDigest:"a".repeat(64),currentPlanDigest:"a".repeat(64)
};
assert.equal(canApproveCurrentDisposition(valid),true);
for(const [key,value] of [
 ["activeAssignment",false],
 ["reviewState","blocked_retention"],
 ["reviewVersion",9],
 ["planBaseReviewVersion",8],
 ["planId",41],
 ["latestPlanId",41],
 ["planDigest","b".repeat(64)],
 ["currentPlanDigest","b".repeat(64)],
 ["actorId",20],
 ["actorId",10],
 ["reviewerRoles",["support_reviewer"]],
]) assert.equal(canApproveCurrentDisposition({...valid,[key]:value}),false,`must reject ${key}`);
assert.equal(canApproveCurrentDisposition({...valid,reviewerRoles:["deletion_second_approver"],planId:0}),false);
console.log("PASS: disposition approval requires an active second-approver assignment, independent actor, current review version, latest plan, active review state, and exact digest.");
