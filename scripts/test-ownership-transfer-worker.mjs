import { createPasswordResetToken, hashPasswordResetToken } from "../src/password-reset-token.mjs";
import { createEmailVerificationToken, hashEmailVerificationToken } from "../src/email-verification-token.mjs";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";

const database = "god-emperornovel-db";
const root = process.cwd();
const temp = await mkdtemp(join(tmpdir(), "imperial-ownership-worker-"));
const persist = join(temp, "state");
let worker;
let workerOutput = "";
async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => server.once("error", reject).listen(0, "127.0.0.1", resolve));
  const value = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return value;
}
function wrangler(args, timeout = 45000) {
  const result = spawnSync("npx", ["--yes", "wrangler@4", ...args], {
    cwd: root, encoding: "utf8", timeout, stdio: "inherit",
    env: { ...process.env, WRANGLER_SEND_METRICS: "false" }
  });
  if (result.status !== 0) throw new Error("wrangler " + args.join(" ") + " failed:\n" + (result.stdout || "") + "\n" + (result.stderr || ""));
  return result.stdout;
}
async function waitForWorker(baseUrl) {
  const deadline = Date.now() + 30000;
  let lastError = "";
  while (Date.now() < deadline) {
    if (worker.exitCode !== null) throw new Error("Wrangler dev exited (" + worker.exitCode + "):\n" + workerOutput);
    try {
      const response = await fetch(baseUrl + "/api/health", { signal: AbortSignal.timeout(5000) });
      if (response.ok && (await response.json()).ok) return;
    } catch (error) { lastError = String(error); }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error("Local Worker did not become healthy. " + lastError + "\n" + workerOutput);
}
async function request(baseUrl, path, options = {}) {
  const headers = {};
  if (options.cookie) headers.cookie = options.cookie;
  if (options.origin) headers.origin = options.origin;
  if (options.body !== undefined) headers["content-type"] = "application/json";
  const response = await fetch(baseUrl + path, {
    method: options.method || "GET", headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: AbortSignal.timeout(15000)
  });
  return { response, data: await response.json().catch(() => ({})) };
}
async function account(baseUrl, username, email) {
  console.log("Registering local account " + username + "...");
  const password = "Integration-Test-Password-2026!";
  const registered = await request(baseUrl, "/api/auth/register", {
    method: "POST", body: { username, email, password }
  });
  assert.equal(registered.response.status, 200, JSON.stringify(registered.data));
  console.log("Signing in local account " + username + "...");
  const loggedIn = await request(baseUrl, "/api/auth/login", {
    method: "POST", body: { email, password }
  });
  assert.equal(loggedIn.response.status, 200, JSON.stringify(loggedIn.data));
  const cookieHeader = loggedIn.response.headers.get("set-cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
  assert.ok(match, "Login must issue a session cookie");
  return { cookie: "session=" + match[1], user: loggedIn.data.user };
}
async function createNovel(baseUrl, cookie, title) {
  const result = await request(baseUrl, "/api/author/novels", {
    method: "POST", cookie,
    body: { title, author: "Integration Test Author", description: "Local-only test fixture", rights_status: "original" }
  });
  assert.equal(result.response.status, 201, JSON.stringify(result.data));
  return Number(result.data.id);
}
async function transferStatus(baseUrl, cookie, id) {
  const result = await request(baseUrl, "/api/author/ownership-transfers", { cookie });
  assert.equal(result.response.status, 200, JSON.stringify(result.data));
  return result.data.find(row => Number(row.id) === id);
}

try {
  const port = await freePort();
  console.log("Applying migrations to isolated local D1...");
  wrangler(["d1", "migrations", "apply", database, "--local", "--persist-to", persist]);
  console.log("Starting local Worker...");
  worker = spawn("npx", [
    "--yes", "wrangler@4", "dev", "--local", "--ip", "127.0.0.1",
    "--port", String(port), "--persist-to", persist, "--inspector-port", "0"
  ], {
    cwd: root, env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
    detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe"]
  });
  worker.stdout.on("data", chunk => { workerOutput += chunk.toString(); });
  worker.stderr.on("data", chunk => { workerOutput += chunk.toString(); });
  const baseUrl = "http://127.0.0.1:" + port;
  await waitForWorker(baseUrl);
  console.log("Local Worker healthy. Creating two isolated author accounts...");
  const resetPage = await fetch(baseUrl + "/reset-password");
  assert.equal(resetPage.status,200,"Password recovery URL must resolve to its dedicated page");
  const resetHtml = await resetPage.text();
  assert.match(resetHtml,/\/api\/auth\/password-reset\/request/);
  assert.match(resetHtml,/\/api\/auth\/password-reset\/complete/);
  assert.match(resetHtml,/history\.replaceState/);
  const verificationPage = await fetch(baseUrl + "/verify-email");
  assert.equal(verificationPage.status,200,"Verification URL must resolve to the dedicated landing page");
  const verificationHtml = await verificationPage.text();
  assert.match(verificationHtml,/\/api\/auth\/verify-email/);
  assert.match(verificationHtml,/location\.hash/);
  assert.match(verificationHtml,/history\.replaceState/);


  const suffix = (String(process.pid) + String(Date.now())).slice(-8);
  const owner = await account(baseUrl, "owner" + suffix, "owner" + suffix + "@example.test");
  const recipient = await account(baseUrl, "author" + suffix, "author" + suffix + "@example.test");
  const spectator = await account(baseUrl, "reader" + suffix, "reader" + suffix + "@example.test");
  const moderator = await account(baseUrl, "moderator" + suffix, "moderator" + suffix + "@example.test");
  const administrator = await account(baseUrl, "administrator" + suffix, "administrator" + suffix + "@example.test");
  const malformedVerification = await request(baseUrl,"/api/auth/verify-email",{method:"POST",body:{token:"not-a-valid-token"}});
  assert.equal(malformedVerification.response.status,400);
  assert.equal(JSON.stringify(malformedVerification.data).includes("not-a-valid-token"),false);

  const unauthenticatedVerificationRequest = await request(baseUrl,"/api/me/email-verification/request",{method:"POST"});
  assert.equal(unauthenticatedVerificationRequest.response.status,401,"Verification issuance must require an authenticated account");
  const unavailableVerificationRequest = await request(baseUrl,"/api/me/email-verification/request",{method:"POST",cookie:spectator.cookie,body:{}});
  assert.equal(unavailableVerificationRequest.response.status,503,"No configured email service must fail closed instead of claiming delivery");
  assert.equal(unavailableVerificationRequest.data.ok,undefined,"Unavailable delivery must not be reported as sent");

  // Verify the public confirmation endpoint consumes a real D1 token exactly once.
  const verificationToken = createEmailVerificationToken();
  const verificationHash = await hashEmailVerificationToken(verificationToken);
  const verificationNow = new Date();
  const verificationExpiry = new Date(verificationNow.getTime() + 30 * 60 * 1000).toISOString();
  const verificationCreated = verificationNow.toISOString();
  const seedVerification = "INSERT INTO email_verification_tokens(user_id,email_snapshot,token_hash,purpose,created_at,expires_at) VALUES(" +
    Number(spectator.user.id) + ",'" + spectator.user.email + "','" + verificationHash + "','email_verification','" +
    verificationCreated + "','" + verificationExpiry + "')";
  wrangler(["d1","execute",database,"--local","--persist-to",persist,"--command",seedVerification]);
  const verified = await request(baseUrl,"/api/auth/verify-email",{method:"POST",body:{token:verificationToken}});
  assert.equal(verified.response.status,200,JSON.stringify(verified.data));
  assert.equal(verified.data.ok,true);
  const replay = await request(baseUrl,"/api/auth/verify-email",{method:"POST",body:{token:verificationToken}});
  assert.equal(replay.response.status,400,"A consumed verification token must not be replayable");
  const verifiedExport = await request(baseUrl,"/api/me/export",{cookie:spectator.cookie});
  assert.equal(verifiedExport.response.status,200,JSON.stringify(verifiedExport.data));
  assert.ok(verifiedExport.data.user.email_verified_at,"Confirmation must set email_verified_at on the token owner");
  assert.ok(Number.isFinite(Date.parse(verifiedExport.data.user.email_verified_at)),"Verification timestamp must be valid ISO date text");
  const unaffectedAccountExport = await request(baseUrl,"/api/me/export",{cookie:recipient.cookie});
  assert.equal(unaffectedAccountExport.response.status,200,JSON.stringify(unaffectedAccountExport.data));
  assert.equal(unaffectedAccountExport.data.user.email_verified_at,null,"Verifying one account must not verify another account");
  const alreadyVerifiedRequest = await request(baseUrl,"/api/me/email-verification/request",{method:"POST",cookie:spectator.cookie,body:{}});
  assert.equal(alreadyVerifiedRequest.response.status,202,"Repeated requests for an already verified mailbox should be harmless and idempotent");



  const promote = "UPDATE users SET role='author' WHERE id IN (" + Number(owner.user.id) + "," + Number(recipient.user.id) + "); UPDATE users SET role='moderator' WHERE id=" + Number(moderator.user.id) + "; UPDATE users SET role='admin' WHERE id=" + Number(administrator.user.id);
  wrangler(["d1", "execute", database, "--local", "--persist-to", persist, "--command", promote]);

  // Every sampled administrator read surface must reject all non-admin roles.
  const adminReadRoutes = [
    "/api/admin/stats",
    "/api/admin/users",
    "/api/admin/agents",
    "/api/admin/taxonomy",
    "/api/admin/community/comments",
    "/api/admin/community/reports",
    "/api/admin/author-applications",
    "/api/admin/publishing",
    "/api/admin/donations",
    "/api/admin/reports",
    "/api/admin/connectors"
  ];
  for (const route of adminReadRoutes) {
    for (const [role, session] of [["user", spectator.cookie], ["author", owner.cookie], ["moderator", moderator.cookie]]) {
      const denied = await request(baseUrl, route, { cookie: session });
      assert.equal(denied.response.status, 403, role + " must not access " + route + ": " + JSON.stringify(denied.data));
    }
  }
  for (const route of ["/api/admin/stats", "/api/admin/users", "/api/admin/agents", "/api/admin/publishing"]) {
    const allowed = await request(baseUrl, route, { cookie: administrator.cookie });
    assert.equal(allowed.response.status, 200, "Admin must access " + route + ": " + JSON.stringify(allowed.data));
  }

  // Payment submissions must be bound to the authenticated account. Only administrators may approve them,
  // and approval credits the donation's stored owner rather than any caller-supplied user_id.
  const donationSubmission = await request(baseUrl, "/api/donations", {
    method: "POST", cookie: spectator.cookie,
    body: { amount: 500, reference_id: "LOCAL-SECURITY-" + suffix, user_id: owner.user.id }
  });
  assert.equal(donationSubmission.response.status, 200, JSON.stringify(donationSubmission.data));
  const donationQueue = await request(baseUrl, "/api/admin/donations", { cookie: administrator.cookie });
  assert.equal(donationQueue.response.status, 200, JSON.stringify(donationQueue.data));
  const submittedDonation = donationQueue.data.find(row => row.reference_id === "LOCAL-SECURITY-" + suffix);
  assert.ok(submittedDonation, "Submitted donation must appear in the administrator queue");
  assert.equal(Number(submittedDonation.user_id), Number(spectator.user.id), "Donation owner must come from the authenticated session, not request user_id");
  const readerApproval = await request(baseUrl, "/api/admin/donations/" + submittedDonation.id, {
    method: "PATCH", cookie: spectator.cookie, body: { status: "approved", tickets: 17, user_id: owner.user.id }
  });
  assert.equal(readerApproval.response.status, 403, "Ordinary readers must not approve donations");
  const moderatorApproval = await request(baseUrl, "/api/admin/donations/" + submittedDonation.id, {
    method: "PATCH", cookie: moderator.cookie, body: { status: "approved", tickets: 17, user_id: owner.user.id }
  });
  assert.equal(moderatorApproval.response.status, 403, "Moderators must not approve donations");
  const approvedDonation = await request(baseUrl, "/api/admin/donations/" + submittedDonation.id, {
    method: "PATCH", cookie: administrator.cookie, body: { status: "approved", tickets: 17, user_id: owner.user.id }
  });
  assert.equal(approvedDonation.response.status, 200, JSON.stringify(approvedDonation.data));
  const spectatorLedger = await request(baseUrl, "/api/tickets/ledger", { cookie: spectator.cookie });
  const ownerLedger = await request(baseUrl, "/api/tickets/ledger", { cookie: owner.cookie });
  assert.ok(spectatorLedger.data.some(row => row.reason === "payment" && row.reference === String(submittedDonation.id) && Number(row.delta) === 17),
    "Approved payment credit must appear only in the submitting account's ledger");
  assert.ok(!ownerLedger.data.some(row => row.reference === String(submittedDonation.id)),
    "Forged user_id must not redirect payment credit to another account");
  const duplicateApproval = await request(baseUrl, "/api/admin/donations/" + submittedDonation.id, {
    method: "PATCH", cookie: administrator.cookie, body: { status: "approved", tickets: 17 }
  });
  assert.equal(duplicateApproval.response.status, 409, "A donation must not be credited twice");

  // Administrative Crown adjustments are restricted to administrators and recorded against the selected account.
  const readerCredit = await request(baseUrl, "/api/admin/tickets", {
    method: "POST", cookie: spectator.cookie, body: { user_id: owner.user.id, amount: 23 }
  });
  assert.equal(readerCredit.response.status, 403, "Readers must not issue Crown credits");
  const moderatorCredit = await request(baseUrl, "/api/admin/tickets", {
    method: "POST", cookie: moderator.cookie, body: { user_id: owner.user.id, amount: 23 }
  });
  assert.equal(moderatorCredit.response.status, 403, "Moderators must not issue Crown credits");
  const ownerBeforeCredit = await request(baseUrl, "/api/me", { cookie: owner.cookie });
  const ledgerBeforeRejectedCredits = await request(baseUrl, "/api/tickets/ledger", { cookie: owner.cookie });
  const invalidCreditAmounts = [0, -1, 1.5, 1000001];
  for (const amount of invalidCreditAmounts) {
    const invalidCredit = await request(baseUrl, "/api/admin/tickets", {
      method: "POST", cookie: administrator.cookie, body: { user_id: owner.user.id, amount }
    });
    assert.equal(invalidCredit.response.status, 400,
      "Invalid administrator credit amount " + amount + " must be rejected");
  }
  const missingTargetCredit = await request(baseUrl, "/api/admin/tickets", {
    method: "POST", cookie: administrator.cookie,
    body: { user_id: 2147483000, amount: 23 }
  });
  assert.equal(missingTargetCredit.response.status, 404,
    "Administrator credit to a nonexistent account must be rejected");
  const ownerAfterRejectedCredits = await request(baseUrl, "/api/me", { cookie: owner.cookie });
  assert.equal(Number(ownerAfterRejectedCredits.data.user.tickets), Number(ownerBeforeCredit.data.user.tickets),
    "Rejected credit requests must not change the account balance");
  const ledgerAfterRejectedCredits = await request(baseUrl, "/api/tickets/ledger", { cookie: owner.cookie });
  assert.equal(ledgerAfterRejectedCredits.data.length, ledgerBeforeRejectedCredits.data.length,
    "Rejected credit attempts must not create ledger entries");

  // Novel requests: first three are free, the fourth is charged once, and rejection refunds once.
  // Fund the disposable local reader fixture so the paid-request path can be exercised.
  const requestTestCredit = await request(baseUrl, "/api/admin/tickets", {
    method: "POST", cookie: administrator.cookie, body: { user_id: spectator.user.id, amount: 100 }
  });
  assert.equal(requestTestCredit.response.status, 200, "Local test account must receive fixture Crowns");
  const requestBalanceBefore = await request(baseUrl, "/api/me", { cookie: spectator.cookie });
  const requestLedgerBefore = await request(baseUrl, "/api/tickets/ledger", { cookie: spectator.cookie });
  const requestUrls = [1, 2, 3, 4].map(n => "https://fanqienovel.com/page/LOCAL-SECURITY-" + suffix + "-" + n);
  const novelRequests = [];
  for (const requestUrl of requestUrls) {
    const submitted = await request(baseUrl, "/api/requests", {
      method: "POST", cookie: spectator.cookie, body: { url: requestUrl, user_id: owner.user.id }
    });
    assert.equal(submitted.response.status, 200, "Supported novel request should be accepted: " + JSON.stringify(submitted.data));
    novelRequests.push(submitted.data);
  }
  assert.deepEqual(novelRequests.map(row => Number(row.cost)), [0, 0, 0, 100],
    "Only requests beyond the three-per-week free allowance should cost Crowns");
  const requestUsage = await request(baseUrl, "/api/requests", { cookie: spectator.cookie });
  assert.equal(Number(requestUsage.data.used), 4, "Request usage must be scoped to the signed-in account");
  const requestBalanceAfter = await request(baseUrl, "/api/me", { cookie: spectator.cookie });
  assert.equal(Number(requestBalanceAfter.data.user.tickets), Number(requestBalanceBefore.data.user.tickets) - 100,
    "The fourth novel request must debit exactly 100 Crowns");
  const requestLedgerAfter = await request(baseUrl, "/api/tickets/ledger", { cookie: spectator.cookie });
  const requestDebits = requestLedgerAfter.data.filter(row => row.reason === "novel_request");
  assert.equal(requestDebits.length - requestLedgerBefore.data.filter(row => row.reason === "novel_request").length, 1,
    "Only the paid novel request should create a debit ledger entry");
  assert.equal(Number(requestDebits.at(-1).delta), -100, "Novel request ledger must record the exact debit");
  const requestQueue = await request(baseUrl, "/api/admin/requests", { cookie: administrator.cookie });
  const paidRequest = requestQueue.data.find(row => Number(row.id) === Number(novelRequests[3].request_id));
  assert.ok(paidRequest, "Administrator request queue must contain the paid request");
  assert.equal(Number(paidRequest.user_id), Number(spectator.user.id),
    "Novel request owner must come from the authenticated session, not forged user_id");
  const rejectPaidRequest = await Promise.all([
    request(baseUrl, "/api/admin/requests/" + paidRequest.id, { method: "PATCH", cookie: administrator.cookie, body: { status: "rejected" } }),
    request(baseUrl, "/api/admin/requests/" + paidRequest.id, { method: "PATCH", cookie: administrator.cookie, body: { status: "rejected" } })
  ]);
  assert.ok(rejectPaidRequest.every(row => [200, 409].includes(row.response.status)),
    "Concurrent rejection must return success or a safe already-processed conflict");
  assert.ok(rejectPaidRequest.some(row => row.response.status === 200),
    "At least one concurrent rejection must commit successfully");
  assert.ok(rejectPaidRequest.filter(row => row.response.status === 200).every(row => row.data.status === "rejected"),
    "Successful concurrent responses must report the final rejected state");
  const requestBalanceRefunded = await request(baseUrl, "/api/me", { cookie: spectator.cookie });
  assert.equal(Number(requestBalanceRefunded.data.user.tickets), Number(requestBalanceBefore.data.user.tickets),
    "A rejected paid request must refund exactly the original debit");
  const requestLedgerRefunded = await request(baseUrl, "/api/tickets/ledger", { cookie: spectator.cookie });
  assert.equal(requestLedgerRefunded.data.filter(row => row.reason === "novel_request_refund" && Number(row.delta) === 100).length, 1,
    "Concurrent duplicate rejection must create exactly one refund ledger entry");
  const duplicateRequestReject = await request(baseUrl, "/api/admin/requests/" + paidRequest.id, {
    method: "PATCH", cookie: administrator.cookie, body: { status: "rejected" }
  });
  assert.equal(duplicateRequestReject.response.status, 200,
    "Repeated rejection should return the existing final state without issuing another refund");
  const requestBalanceAfterRepeat = await request(baseUrl, "/api/me", { cookie: spectator.cookie });
  assert.equal(Number(requestBalanceAfterRepeat.data.user.tickets), Number(requestBalanceBefore.data.user.tickets),
    "Repeated rejection must never issue a second refund");
  const insecureRequest = await request(baseUrl, "/api/requests", {
    method: "POST", cookie: spectator.cookie, body: { url: "http://fanqienovel.com/page/123" }
  });
  assert.equal(insecureRequest.response.status, 400, "Novel request URLs must require HTTPS");
  const unsupportedRequest = await request(baseUrl, "/api/requests", {
    method: "POST", cookie: spectator.cookie, body: { url: "https://untrusted.example/book/123" }
  });
  assert.equal(unsupportedRequest.response.status, 400, "Novel requests must reject unregistered source domains");
  const spectatorBeforeCredit = await request(baseUrl, "/api/me", { cookie: spectator.cookie });

  const adminCredit = await request(baseUrl, "/api/admin/tickets", {
    method: "POST", cookie: administrator.cookie, body: { user_id: owner.user.id, amount: 23 }
  });
  assert.equal(adminCredit.response.status, 200, JSON.stringify(adminCredit.data));
  const ownerAfterCredit = await request(baseUrl, "/api/me", { cookie: owner.cookie });
  assert.equal(Number(ownerAfterCredit.data.user.tickets), Number(ownerBeforeCredit.data.user.tickets) + 23,
    "Administrator credit must update the explicitly selected account");
  const creditedLedger = await request(baseUrl, "/api/tickets/ledger", { cookie: owner.cookie });
  assert.ok(creditedLedger.data.some(row => row.reason === "admin_adjustment" && Number(row.delta) === 23),
    "Administrator credit must create a matching ledger entry");
  const spectatorAfterCredit = await request(baseUrl, "/api/me", { cookie: spectator.cookie });
  assert.equal(Number(spectatorAfterCredit.data.user.tickets), Number(spectatorBeforeCredit.data.user.tickets),
    "Administrative credit must not alter another account's balance");

  // Chapter unlocks must debit once under concurrent requests and keep the account ledger consistent.
  wrangler(["d1", "execute", database, "--local", "--persist-to", persist, "--command",
    "UPDATE users SET tickets=500 WHERE id=" + Number(spectator.user.id)]);
  async function createPublishedLockedNovel(title, chapters) {
    const novelId = await createNovel(baseUrl, owner.cookie, title + " " + suffix);
    const ownerNovelBefore = await request(baseUrl, "/api/author/novels", { cookie: owner.cookie });
    const originalNovel = ownerNovelBefore.data.find(row => Number(row.id) === novelId);
    assert.ok(originalNovel, "Owner must see the newly created novel");
    const foreignNovelEdit = await request(baseUrl, "/api/author/novels/" + novelId, {
      method: "PATCH", cookie: recipient.cookie,
      body: { title: "Unauthorized foreign novel edit", description: "Must remain unchanged." }
    });
    assert.equal(foreignNovelEdit.response.status, 403, "A different author must not edit another author's novel");
    const ownerNovelAfter = await request(baseUrl, "/api/author/novels", { cookie: owner.cookie });
    const preservedNovel = ownerNovelAfter.data.find(row => Number(row.id) === novelId);
    assert.equal(preservedNovel.title, originalNovel.title, "Foreign novel edit attempt must preserve the owner's title");
    assert.equal(preservedNovel.description, originalNovel.description, "Foreign novel edit attempt must preserve the owner's description");
    executeLocalSql("UPDATE novels SET publication_status='published',rights_status='original',rights_evidence='local-original-work-attestation' WHERE id=" + novelId);
    const chapterIds = [];
    for (const chapter of chapters) {
      const created = await request(baseUrl, "/api/author/chapters", {
        method: "POST", cookie: owner.cookie,
        body: { novel_id: novelId, chapter_number: chapter.number, title: chapter.title, content: "Local integration test chapter body.", is_locked: true, ticket_cost: chapter.cost }
      });
      assert.equal(created.response.status, 201, JSON.stringify(created.data));
      chapterIds.push(Number(created.data.id));
      const foreignChapterId = Number(created.data.id);
      const foreignEdit = await request(baseUrl, "/api/author/chapters/" + foreignChapterId, {
        method: "PATCH", cookie: recipient.cookie,
        body: { title: "Unauthorized foreign edit", content: "This must never replace the owner's chapter." }
      });
      assert.equal(foreignEdit.response.status, 403, "A different author must not edit another author's chapter");
      const foreignPublish = await request(baseUrl, "/api/author/chapters/" + foreignChapterId + "/publish", {
        method: "POST", cookie: recipient.cookie, body: { publication_status: "published" }
      });
      assert.ok([403, 404].includes(foreignPublish.response.status), "A different author must not publish another author's chapter; 404 is acceptable anti-enumeration behavior");
      const preservedChapter = await request(baseUrl, "/api/author/chapters?novel_id=" + novelId, { cookie: owner.cookie });
      assert.equal(preservedChapter.response.status, 200);
      const preserved = preservedChapter.data.find(row => Number(row.id) === foreignChapterId);
      assert.equal(preserved.title, chapter.title, "Foreign edit attempt must leave the owner's chapter title unchanged");
      assert.equal(preserved.content, "Local integration test chapter body.", "Foreign edit attempt must leave chapter content unchanged");
    }
    executeLocalSql("UPDATE chapters SET publication_status='published' WHERE novel_id=" + novelId);
    return { novelId, chapterIds };
  }
  const singleUnlockFixture = await createPublishedLockedNovel("Concurrent Single Unlock", [
    { number: 1, title: "Locked Chapter One", cost: 10 }
  ]);
  const singleUnlocks = await Promise.all([
    request(baseUrl, "/api/chapters/" + singleUnlockFixture.chapterIds[0] + "/unlock", { method: "POST", cookie: spectator.cookie }),
    request(baseUrl, "/api/chapters/" + singleUnlockFixture.chapterIds[0] + "/unlock", { method: "POST", cookie: spectator.cookie })
  ]);
  assert.ok(singleUnlocks.every(x => x.response.status === 200), "Concurrent duplicate unlock requests should be idempotently successful");
  const afterSingleUnlock = await request(baseUrl, "/api/me", { cookie: spectator.cookie });
  assert.equal(Number(afterSingleUnlock.data.user.tickets), 490, "Single chapter unlock must debit exactly one chapter price");
  const singleLedger = await request(baseUrl, "/api/tickets/ledger", { cookie: spectator.cookie });
  assert.equal(singleLedger.data.filter(row => row.reason === "chapter_unlock" && row.reference === String(singleUnlockFixture.chapterIds[0]) && Number(row.delta) === -10).length, 1,
    "Single unlock must create exactly one matching ledger debit");

  const batchUnlockFixture = await createPublishedLockedNovel("Concurrent Batch Unlock", [
    { number: 1, title: "Batch Chapter One", cost: 5 },
    { number: 2, title: "Batch Chapter Two", cost: 7 }
  ]);
  const batchUnlocks = await Promise.all([
    request(baseUrl, "/api/novels/" + batchUnlockFixture.novelId + "/batch-unlock", { method: "POST", cookie: spectator.cookie, body: { count: 10, start_chapter: 1 } }),
    request(baseUrl, "/api/novels/" + batchUnlockFixture.novelId + "/batch-unlock", { method: "POST", cookie: spectator.cookie, body: { count: 10, start_chapter: 1 } })
  ]);
  assert.ok(batchUnlocks.every(x => x.response.status === 200 || x.response.status === 409), "Concurrent duplicate batch unlocks may succeed once or safely reject the losing request");
  // The losing request may observe the completed unlocks on its initial read and
  // return an idempotent 200 with unlocked=0/cost=0. Count committed work, not HTTP 200s.
  assert.equal(batchUnlocks.filter(x => Number(x.data.unlocked || 0) > 0).length, 1, "Exactly one concurrent batch request should commit the unlock");
  assert.ok(batchUnlocks.some(x => x.response.status === 409) || batchUnlocks.some(x => x.response.status === 200 && Number(x.data.unlocked || 0) === 0), "The duplicate request must be rejected or return an idempotent no-op");
  assert.equal(batchUnlocks.reduce((sum, x) => sum + Number(x.data.unlocked || 0), 0), 2, "Concurrent batch requests must unlock each chapter only once");
  assert.equal(batchUnlocks.reduce((sum, x) => sum + Number(x.data.cost || 0), 0), 12, "Concurrent batch requests must charge the combined chapter cost only once");
  const afterBatchUnlock = await request(baseUrl, "/api/me", { cookie: spectator.cookie });
  assert.equal(Number(afterBatchUnlock.data.user.tickets), 478, "Batch unlock must debit exactly the combined chapter price");
  const batchLedger = await request(baseUrl, "/api/tickets/ledger", { cookie: spectator.cookie });
  assert.equal(batchLedger.data.filter(row => row.reason === "batch_unlock" && Number(row.delta) === -12).length, 1,
    "Batch unlock must create exactly one matching ledger debit");

  // Moderators cannot change account roles or ban state. Admin status changes revoke every existing session.
  const moderatorEscalation = await request(baseUrl, "/api/admin/users/" + spectator.user.id, {
    method: "PATCH", cookie: moderator.cookie, body: { role: "admin", verified: true, banned: false }
  });
  assert.equal(moderatorEscalation.response.status, 403, "Moderator must not promote an account");
  const banReader = await request(baseUrl, "/api/admin/users/" + spectator.user.id, {
    method: "PATCH", cookie: administrator.cookie, body: { role: "user", verified: false, banned: true }
  });
  assert.equal(banReader.response.status, 200, JSON.stringify(banReader.data));
  assert.equal(banReader.data.sessions_revoked, true);
  const bannedSession = await request(baseUrl, "/api/me", { cookie: spectator.cookie });
  assert.equal(bannedSession.data.user, null, "A banned user's existing session must be invalidated");
  const bannedLogin = await request(baseUrl, "/api/auth/login", {
    method: "POST", body: { email: "reader" + suffix + "@example.test", password: "Integration-Test-Password-2026!" }
  });
  assert.equal(bannedLogin.response.status, 403, "A banned account must not obtain a new session");
  const unbanReader = await request(baseUrl, "/api/admin/users/" + spectator.user.id, {
    method: "PATCH", cookie: administrator.cookie, body: { role: "user", verified: false, banned: false }
  });
  assert.equal(unbanReader.response.status, 200, JSON.stringify(unbanReader.data));
  const oldSessionAfterUnban = await request(baseUrl, "/api/me", { cookie: spectator.cookie });
  assert.equal(oldSessionAfterUnban.data.user, null, "Unbanning must not resurrect revoked sessions");
  const freshReaderLogin = await request(baseUrl, "/api/auth/login", {
    method: "POST", body: { email: "reader" + suffix + "@example.test", password: "Integration-Test-Password-2026!" }
  });
  assert.equal(freshReaderLogin.response.status, 200, JSON.stringify(freshReaderLogin.data));
  spectator.cookie = "session=" + (freshReaderLogin.response.headers.get("set-cookie") || "").match(/(?:^|;\s*)session=([^;]+)/)?.[1];
  assert.ok(spectator.cookie && spectator.cookie !== "session=null", "Unbanned account must obtain a fresh session");

  // Private reader data must remain scoped to the authenticated session, never a caller-supplied user ID.
  const privateNovel = await createNovel(baseUrl, owner.cookie, "Private Data Isolation Fixture");
  executeLocalSql("UPDATE novels SET publication_status='published' WHERE id=" + privateNovel);
  const privateChapter = await request(baseUrl, "/api/author/chapters", {
    method: "POST", cookie: owner.cookie,
    body: { novel_id: privateNovel, chapter_number: 1, title: "Private Fixture Chapter", content: "local only", is_locked: true, ticket_cost: 1 }
  });
  assert.equal(privateChapter.response.status, 201, JSON.stringify(privateChapter.data));
  const ownerId = Number(owner.user.id), spectatorId = Number(spectator.user.id), chapterId = Number(privateChapter.data.id);
  const ownerChapterList = await request(baseUrl, "/api/author/chapters?novel_id=" + privateNovel, { cookie: owner.cookie });
  assert.equal(ownerChapterList.response.status, 200, JSON.stringify(ownerChapterList.data));
  assert.ok(ownerChapterList.data.some(row => Number(row.id) === chapterId));
  const otherAuthorChapterList = await request(baseUrl, "/api/author/chapters?novel_id=" + privateNovel, { cookie: recipient.cookie });
  assert.equal(otherAuthorChapterList.response.status, 403, "A different author must not read private chapter drafts");
  const otherAuthorChapterPublish = await request(baseUrl, "/api/author/chapters/" + chapterId + "/publish", {
    method: "POST", cookie: recipient.cookie, body: { publication_status: "published" }
  });
  assert.ok([403, 404].includes(otherAuthorChapterPublish.response.status), "A different author must not publish another author's chapter: " + JSON.stringify(otherAuthorChapterPublish.data));
  const chapterAfterForeignPublish = await request(baseUrl, "/api/author/chapters?novel_id=" + privateNovel, { cookie: owner.cookie });
  assert.equal(chapterAfterForeignPublish.data.find(row => Number(row.id) === chapterId)?.publication_status, "draft", "Foreign publish attempt must leave the chapter as a draft");
  executeLocalSql("INSERT INTO history(user_id,novel_id,chapter_number) VALUES(" + ownerId + "," + privateNovel + ",1);"
    + "INSERT INTO bookmarks(user_id,novel_id,chapter_number) VALUES(" + ownerId + "," + privateNovel + ",1);"
    + "INSERT INTO user_library(user_id,novel_id) VALUES(" + ownerId + "," + privateNovel + ");"
    + "INSERT INTO follows(user_id,novel_id) VALUES(" + ownerId + "," + privateNovel + ");"
    + "INSERT INTO notifications(user_id,title,body) VALUES(" + ownerId + ",'Private fixture','owner-only notification');"
    + "INSERT INTO ticket_ledger(user_id,delta,reason,reference) VALUES(" + ownerId + ",7,'isolation_fixture','owner-only-ledger');"
    + "INSERT INTO unlocks(user_id,chapter_id,cost) VALUES(" + ownerId + "," + chapterId + ",1)");
  for (const [route, fixtureField] of [
    ["/api/history", "novel_id"], ["/api/library", "novel_id"], ["/api/bookmarks", "novel_id"],
    ["/api/follows", "id"], ["/api/notifications", "title"], ["/api/tickets/ledger", "reference"]
  ]) {
    const own = await request(baseUrl, route, { cookie: owner.cookie });
    const other = await request(baseUrl, route, { cookie: spectator.cookie });
    assert.equal(own.response.status, 200, "Owner must read " + route);
    assert.equal(other.response.status, 200, "Other account must read " + route);
    assert.ok(own.data.some(row => String(row[fixtureField]) === String(
      fixtureField === "novel_id" || fixtureField === "id" ? privateNovel : fixtureField === "title" ? "Private fixture" : "owner-only-ledger"
    )), "Fixture must be visible to its owner at " + route);
    assert.ok(!other.data.some(row => String(row[fixtureField]) === String(
      fixtureField === "novel_id" || fixtureField === "id" ? privateNovel : fixtureField === "title" ? "Private fixture" : "owner-only-ledger"
    )), "Private fixture leaked to another account at " + route);
  }
  const ownerProfile = await request(baseUrl, "/api/profile", { cookie: owner.cookie });
  const spectatorProfile = await request(baseUrl, "/api/profile", { cookie: spectator.cookie });
  assert.equal(ownerProfile.response.status, 200);
  assert.equal(spectatorProfile.response.status, 200);
  assert.ok(Number(ownerProfile.data.stats.history) >= 1);
  assert.equal(Number(spectatorProfile.data.stats.history), 0, "Profile statistics must not include another account's history");

  // Even if a client sends a foreign user_id, writes must be attributed to the signed-in account.
  await request(baseUrl, "/api/history", { method: "POST", cookie: spectator.cookie, body: { user_id: ownerId, novel_id: privateNovel, chapter_number: 2 } });
  const spectatorHistory = await request(baseUrl, "/api/history", { cookie: spectator.cookie });
  const ownerHistory = await request(baseUrl, "/api/history", { cookie: owner.cookie });
  assert.ok(spectatorHistory.data.some(row => Number(row.chapter_number) === 2));
  assert.ok(ownerHistory.data.some(row => Number(row.chapter_number) === 1), "A supplied user_id must not overwrite the owner's history");

  const acceptedNovel = await createNovel(baseUrl, owner.cookie, "Ownership Integration Accepted");
  const lookup = await request(baseUrl, "/api/author/eligible-recipients?username=" + encodeURIComponent(recipient.user.username), { cookie: owner.cookie });
  assert.equal(lookup.response.status, 200, JSON.stringify(lookup.data));
  assert.equal(Number(lookup.data.id), Number(recipient.user.id));
  assert.deepEqual(Object.keys(lookup.data).sort(), ["id", "username"], "Recipient lookup must not disclose email or profile fields");
  const invitation = await request(baseUrl, "/api/author/novels/" + acceptedNovel + "/ownership-transfer", {
    method: "POST", cookie: owner.cookie, body: { recipient_user_id: recipient.user.id, request_note: "Local integration test" }
  });
  assert.equal(invitation.response.status, 201, JSON.stringify(invitation.data));
  const transferId = Number(invitation.data.transfer_id);
  const spectatorTransferList = await request(baseUrl, "/api/author/ownership-transfers", { cookie: spectator.cookie });
  assert.equal(spectatorTransferList.response.status, 403, JSON.stringify(spectatorTransferList.data));
  const spectatorCannotAccept = await request(baseUrl, "/api/author/ownership-transfers/" + transferId + "/decision", {
    method: "POST", cookie: spectator.cookie, body: { decision: "accept" }
  });
  assert.equal(spectatorCannotAccept.response.status, 403, JSON.stringify(spectatorCannotAccept.data));
  const spectatorCannotLookup = await request(baseUrl, "/api/author/eligible-recipients?username=" + encodeURIComponent(recipient.user.username), { cookie: spectator.cookie });
  assert.equal(spectatorCannotLookup.response.status, 403, JSON.stringify(spectatorCannotLookup.data));

  const ownerCannotAcceptOwnInvitation = await request(baseUrl, "/api/author/ownership-transfers/" + transferId + "/decision", {
    method: "POST", cookie: owner.cookie, body: { decision: "accept" }
  });
  assert.equal(ownerCannotAcceptOwnInvitation.response.status, 403, JSON.stringify(ownerCannotAcceptOwnInvitation.data));
  const decisions = await Promise.all([
    request(baseUrl, "/api/author/ownership-transfers/" + transferId + "/decision", { method: "POST", cookie: recipient.cookie, body: { decision: "accept" } }),
    request(baseUrl, "/api/author/ownership-transfers/" + transferId + "/decision", { method: "POST", cookie: recipient.cookie, body: { decision: "accept" } })
  ]);
  assert.equal(decisions.filter(x => x.response.status === 200).length, 1, JSON.stringify(decisions.map(x => ({ status: x.response.status, data: x.data }))));
  assert.equal(decisions.filter(x => x.response.status === 409).length, 1, "Duplicate acceptance must be rejected");
  assert.equal((await transferStatus(baseUrl, recipient.cookie, transferId)).status, "accepted");

  const ownerNovelsAfter = await request(baseUrl, "/api/author/novels", { cookie: owner.cookie });
  const recipientNovelsAfter = await request(baseUrl, "/api/author/novels", { cookie: recipient.cookie });
  assert.equal(ownerNovelsAfter.response.status, 200);
  assert.equal(recipientNovelsAfter.response.status, 200);
  assert.ok(!ownerNovelsAfter.data.some(row => Number(row.id) === acceptedNovel), "Former owner must lose the novel from their author inventory");
  assert.ok(recipientNovelsAfter.data.some(row => Number(row.id) === acceptedNovel), "Recipient must gain the novel in their author inventory");
  const formerOwnerEdit = await request(baseUrl, "/api/author/novels/" + acceptedNovel, {
    method: "PATCH", cookie: owner.cookie, body: { title: "Unauthorized former-owner edit" }
  });
  assert.equal(formerOwnerEdit.response.status, 403, JSON.stringify(formerOwnerEdit.data));
  const recipientEdit = await request(baseUrl, "/api/author/novels/" + acceptedNovel, {
    method: "PATCH", cookie: recipient.cookie, body: { title: "Recipient Ownership Confirmed" }
  });
  assert.equal(recipientEdit.response.status, 200, JSON.stringify(recipientEdit.data));
  const chapterCreated = await request(baseUrl, "/api/author/chapters", {
    method: "POST", cookie: recipient.cookie,
    body: { novel_id: acceptedNovel, chapter_number: 1, title: "Transferred Chapter", content: "Local integration fixture content", is_locked: false, ticket_cost: 0 }
  });
  assert.equal(chapterCreated.response.status, 201, JSON.stringify(chapterCreated.data));
  const formerOwnerChapterEdit = await request(baseUrl, "/api/author/chapters/" + chapterCreated.data.id, {
    method: "PATCH", cookie: owner.cookie, body: { title: "Unauthorized chapter edit" }
  });
  assert.equal(formerOwnerChapterEdit.response.status, 403, JSON.stringify(formerOwnerChapterEdit.data));
  const recipientChapterEdit = await request(baseUrl, "/api/author/chapters/" + chapterCreated.data.id, {
    method: "PATCH", cookie: recipient.cookie, body: { title: "Recipient chapter edit" }
  });
  assert.equal(recipientChapterEdit.response.status, 200, JSON.stringify(recipientChapterEdit.data));

  const rejectedNovel = await createNovel(baseUrl, owner.cookie, "Ownership Integration Rejected");
  const rejectedInvite = await request(baseUrl, "/api/author/novels/" + rejectedNovel + "/ownership-transfer", {
    method: "POST", cookie: owner.cookie, body: { recipient_user_id: recipient.user.id }
  });
  assert.equal(rejectedInvite.response.status, 201, JSON.stringify(rejectedInvite.data));
  const rejected = await request(baseUrl, "/api/author/ownership-transfers/" + rejectedInvite.data.transfer_id + "/decision", {
    method: "POST", cookie: recipient.cookie, body: { decision: "reject", decision_note: "Test rejection" }
  });
  assert.equal(rejected.response.status, 200, JSON.stringify(rejected.data));
  assert.equal((await transferStatus(baseUrl, owner.cookie, Number(rejectedInvite.data.transfer_id))).status, "rejected");
  const ownerStillHasRejected = await request(baseUrl, "/api/author/novels", { cookie: owner.cookie });
  assert.ok(ownerStillHasRejected.data.some(row => Number(row.id) === rejectedNovel));

  const cancelledNovel = await createNovel(baseUrl, owner.cookie, "Ownership Integration Cancelled");
  const cancelledInvite = await request(baseUrl, "/api/author/novels/" + cancelledNovel + "/ownership-transfer", {
    method: "POST", cookie: owner.cookie, body: { recipient_user_id: recipient.user.id }
  });
  assert.equal(cancelledInvite.response.status, 201, JSON.stringify(cancelledInvite.data));
  const recipientCannotCancel = await request(baseUrl, "/api/author/ownership-transfers/" + cancelledInvite.data.transfer_id + "/cancel", {
    method: "POST", cookie: recipient.cookie
  });
  assert.equal(recipientCannotCancel.response.status, 409, JSON.stringify(recipientCannotCancel.data));
  const cancelled = await request(baseUrl, "/api/author/ownership-transfers/" + cancelledInvite.data.transfer_id + "/cancel", {
    method: "POST", cookie: owner.cookie
  });
  assert.equal(cancelled.response.status, 200, JSON.stringify(cancelled.data));
  assert.equal((await transferStatus(baseUrl, owner.cookie, Number(cancelledInvite.data.transfer_id))).status, "cancelled");
  const ownerStillHasCancelled = await request(baseUrl, "/api/author/novels", { cookie: owner.cookie });
  assert.ok(ownerStillHasCancelled.data.some(row => Number(row.id) === cancelledNovel));


  async function inviteNovel(title) {
    const novelId = await createNovel(baseUrl, owner.cookie, title);
    const invited = await request(baseUrl, "/api/author/novels/" + novelId + "/ownership-transfer", {
      method: "POST", cookie: owner.cookie, body: { recipient_user_id: recipient.user.id }
    });
    assert.equal(invited.response.status, 201, JSON.stringify(invited.data));
    return { novelId, transferId: Number(invited.data.transfer_id) };
  }
  function executeLocalSql(sql) {
    wrangler(["d1", "execute", database, "--local", "--persist-to", persist, "--command", sql]);
  }

  // Account export must be authenticated, private, read-only, and isolated across two users.
  const exportOwnerNovel = await createNovel(baseUrl, owner.cookie, "Account Export Owner Fixture");
  executeLocalSql(
    "INSERT INTO history(user_id,novel_id,chapter_number) VALUES(" + Number(owner.user.id) + ",990001,3),(" + Number(spectator.user.id) + ",990002,7);" +
    "INSERT INTO notifications(user_id,title,body) VALUES(" + Number(owner.user.id) + ",'EXPORT_OWNER_" + suffix + "','Owner-only export sentinel'),(" + Number(spectator.user.id) + ",'EXPORT_READER_" + suffix + "','Reader-only export sentinel');" +
    "INSERT INTO ticket_ledger(user_id,delta,reason,reference) VALUES(" + Number(owner.user.id) + ",5,'export_test','OWNER_LEDGER_" + suffix + "'),(" + Number(spectator.user.id) + ",9,'export_test','READER_LEDGER_" + suffix + "');"
  );
  const anonymousExport = await request(baseUrl, "/api/me/export");
  assert.equal(anonymousExport.response.status, 401, "Anonymous users must not export account data");
  let ownerExport = await request(baseUrl, "/api/me/export", { cookie: owner.cookie });
  assert.equal(ownerExport.response.status, 200, JSON.stringify(ownerExport.data));
  executeLocalSql(
    "INSERT INTO ai_author_projects(owner_user_id,name,premise) VALUES(" + Number(owner.user.id) + ",'EXPORT_AI_OWNER_" + suffix + "','Owner AI project'),(" + Number(spectator.user.id) + ",'EXPORT_AI_READER_" + suffix + "','Reader AI project');" +
    "INSERT INTO import_jobs(user_id,source_url,status) VALUES(" + Number(owner.user.id) + ",'https://example.test/owner-" + suffix + "','queued'),(" + Number(spectator.user.id) + ",'https://example.test/reader-" + suffix + "','queued');"
  );
  ownerExport = await request(baseUrl, "/api/me/export", { cookie: owner.cookie });
  assert.equal(ownerExport.response.status, 200, JSON.stringify(ownerExport.data));
  assert.match(ownerExport.response.headers.get("content-disposition") || "", /attachment; filename="imperial-novel-account-export\.json"/);
  assert.match(ownerExport.response.headers.get("cache-control") || "", /no-store/);
  assert.equal(Number(ownerExport.data.user.id), Number(owner.user.id));
  assert.ok(ownerExport.data.reading.history.some(row => Number(row.novel_id) === 990001), "Owner export must include the owner's history");
  assert.ok(!ownerExport.data.reading.history.some(row => Number(row.novel_id) === 990002), "Owner export must not include another account's history");
  assert.ok(ownerExport.data.notifications.some(row => row.title === "EXPORT_OWNER_" + suffix), "Owner export must include the owner's notification");
  assert.ok(!ownerExport.data.notifications.some(row => row.title === "EXPORT_READER_" + suffix), "Owner export must exclude another account's notification");
  assert.ok(ownerExport.data.finance.ticket_ledger.some(row => row.reference === "OWNER_LEDGER_" + suffix), "Owner export must include the owner's ledger entry");
  assert.ok(!ownerExport.data.finance.ticket_ledger.some(row => row.reference === "READER_LEDGER_" + suffix), "Owner export must exclude another account's ledger entry");
  assert.ok(ownerExport.data.creator_content.novels.some(row => Number(row.id) === exportOwnerNovel), "Author export must include owned novels");
  assert.ok(ownerExport.data.creator_content.ai_projects.some(row => row.name === "EXPORT_AI_OWNER_" + suffix), "Owner export must include the owner's AI Author Studio projects");
  assert.ok(!ownerExport.data.creator_content.ai_projects.some(row => row.name === "EXPORT_AI_READER_" + suffix), "Owner export must exclude another account's AI projects");
  assert.ok(ownerExport.data.omniportal.import_jobs.some(row => row.source_url.includes("owner-" + suffix)), "Owner export must include the owner's OmniPortal import jobs");
  assert.ok(!ownerExport.data.omniportal.import_jobs.some(row => row.source_url.includes("reader-" + suffix)), "Owner export must exclude another account's import jobs");
  const ownerExportText = JSON.stringify(ownerExport.data);
  assert.ok(!ownerExportText.includes("password_hash") && !ownerExportText.includes("token_hash"), "Export must not disclose password or session hashes");
  assert.ok(!ownerExportText.includes(owner.cookie.slice("session=".length)), "Export must not disclose the active session token");
  assert.ok(!("review_notes" in ownerExport.data) && !("reviewed_by" in ownerExport.data), "Export must not disclose internal reviewer data");
  const readerExport = await request(baseUrl, "/api/me/export", { cookie: spectator.cookie });
  assert.equal(readerExport.response.status, 200, JSON.stringify(readerExport.data));
  assert.equal(Number(readerExport.data.user.id), Number(spectator.user.id));
  assert.ok(readerExport.data.reading.history.some(row => Number(row.novel_id) === 990002), "Second account must receive its own history");
  assert.ok(!readerExport.data.reading.history.some(row => Number(row.novel_id) === 990001), "Second account must not receive the first account's history");
  assert.ok(readerExport.data.creator_content.ai_projects.some(row => row.name === "EXPORT_AI_READER_" + suffix), "Second account must receive its own AI project");
  assert.ok(!readerExport.data.creator_content.ai_projects.some(row => row.name === "EXPORT_AI_OWNER_" + suffix), "Second account must not receive the first account's AI project");
  assert.ok(readerExport.data.omniportal.import_jobs.some(row => row.source_url.includes("reader-" + suffix)), "Second account must receive its own import job");
  assert.ok(!readerExport.data.omniportal.import_jobs.some(row => row.source_url.includes("owner-" + suffix)), "Second account must not receive the first account's import job");
  const ownerExportSecond = await request(baseUrl, "/api/me/export", { cookie: owner.cookie });
  assert.equal(ownerExportSecond.response.status, 200, "The first three exports per account should be allowed");
  const ownerExportRateLimited = await request(baseUrl, "/api/me/export", { cookie: owner.cookie });
  assert.equal(ownerExportRateLimited.response.status, 429, "Repeated export generation must be rate limited per account");

  // Eligibility is rechecked at acceptance, not merely when the invitation is sent.
  const bannedCase = await inviteNovel("Ownership Integration Banned Recipient");
  executeLocalSql("UPDATE users SET banned=1 WHERE id=" + Number(recipient.user.id));
  const bannedAccept = await request(baseUrl, "/api/author/ownership-transfers/" + bannedCase.transferId + "/decision", {
    method: "POST", cookie: recipient.cookie, body: { decision: "accept" }
  });
  assert.equal(bannedAccept.response.status, 403, JSON.stringify(bannedAccept.data));
  executeLocalSql("UPDATE users SET banned=0 WHERE id=" + Number(recipient.user.id));
  assert.ok((await request(baseUrl, "/api/author/novels", { cookie: owner.cookie })).data.some(row => Number(row.id) === bannedCase.novelId));

  const revokedCase = await inviteNovel("Ownership Integration Revoked Author");
  executeLocalSql("UPDATE users SET role='user' WHERE id=" + Number(recipient.user.id));
  const revokedAccept = await request(baseUrl, "/api/author/ownership-transfers/" + revokedCase.transferId + "/decision", {
    method: "POST", cookie: recipient.cookie, body: { decision: "accept" }
  });
  assert.equal(revokedAccept.response.status, 403, JSON.stringify(revokedAccept.data));
  executeLocalSql("UPDATE users SET role='author' WHERE id=" + Number(recipient.user.id));
  assert.ok((await request(baseUrl, "/api/author/novels", { cookie: owner.cookie })).data.some(row => Number(row.id) === revokedCase.novelId));

  const staleCase = await inviteNovel("Ownership Integration Stale Owner");
  executeLocalSql("UPDATE novels SET owner_user_id=" + Number(recipient.user.id) + " WHERE id=" + staleCase.novelId);
  const staleAccept = await request(baseUrl, "/api/author/ownership-transfers/" + staleCase.transferId + "/decision", {
    method: "POST", cookie: recipient.cookie, body: { decision: "accept" }
  });
  assert.equal(staleAccept.response.status, 409, JSON.stringify(staleAccept.data));
  const staleOwnerRow = await request(baseUrl, "/api/author/novels", { cookie: recipient.cookie });
  assert.ok(staleOwnerRow.data.some(row => Number(row.id) === staleCase.novelId), "A stale invitation must not overwrite the newer owner");

  const expiredCase = await inviteNovel("Ownership Integration Expired");
  executeLocalSql("UPDATE novel_ownership_transfers SET requested_at=unixepoch()-3600,expires_at=unixepoch()-1 WHERE id=" + expiredCase.transferId);
  const expiredAccept = await request(baseUrl, "/api/author/ownership-transfers/" + expiredCase.transferId + "/decision", {
    method: "POST", cookie: recipient.cookie, body: { decision: "accept" }
  });
  assert.equal(expiredAccept.response.status, 409, JSON.stringify(expiredAccept.data));
  assert.equal((await transferStatus(baseUrl, owner.cookie, expiredCase.transferId)).status, "expired");

  const rightsCase = await createNovel(baseUrl, owner.cookie, "Ownership Integration Rights Evidence");
  executeLocalSql("UPDATE novels SET rights_status='licensed',rights_evidence='' WHERE id=" + rightsCase);
  const rightsInvite = await request(baseUrl, "/api/author/novels/" + rightsCase + "/ownership-transfer", {
    method: "POST", cookie: owner.cookie, body: { recipient_user_id: recipient.user.id }
  });
  assert.equal(rightsInvite.response.status, 409, JSON.stringify(rightsInvite.data));

  // Logout revokes only the presented session, and repeated logout is safe.
  const secondaryOwnerLogin = await request(baseUrl, "/api/auth/login", {
    method: "POST",
    body: { email: "owner" + suffix + "@example.test", password: "Integration-Test-Password-2026!" }
  });
  assert.equal(secondaryOwnerLogin.response.status, 200, JSON.stringify(secondaryOwnerLogin.data));
  const secondaryCookieMatch = (secondaryOwnerLogin.response.headers.get("set-cookie") || "").match(/(?:^|;\\s*)session=([^;]+)/);
  assert.ok(secondaryCookieMatch, "A second login must issue an independent session");
  const secondaryOwnerCookie = "session=" + secondaryCookieMatch[1];
  const logoutOriginal = await request(baseUrl, "/api/auth/logout", { method: "POST", cookie: owner.cookie });
  assert.equal(logoutOriginal.response.status, 200);
  assert.equal((await request(baseUrl, "/api/me", { cookie: owner.cookie })).data.user, null,
    "Logging out must invalidate the presented session");
  assert.ok((await request(baseUrl, "/api/me", { cookie: secondaryOwnerCookie })).data.user,
    "Logging out one device must not revoke a different active session");
  const logoutSecondary = await request(baseUrl, "/api/auth/logout", { method: "POST", cookie: secondaryOwnerCookie });
  assert.equal(logoutSecondary.response.status, 200);
  assert.equal((await request(baseUrl, "/api/me", { cookie: secondaryOwnerCookie })).data.user, null,
    "The second session must also be revoked when explicitly logged out");
  const repeatedLogout = await request(baseUrl, "/api/auth/logout", { method: "POST", cookie: secondaryOwnerCookie });
  assert.equal(repeatedLogout.response.status, 200, "Repeated logout should remain safe and idempotent");
  // Expired sessions must be rejected even when the account remains active.
  const expiredSessionLogin = await request(baseUrl, "/api/auth/login", {
    method: "POST",
    body: { email: "owner" + suffix + "@example.test", password: "Integration-Test-Password-2026!" }
  });
  assert.equal(expiredSessionLogin.response.status, 200, JSON.stringify(expiredSessionLogin.data));
  const expiredCookieMatch = (expiredSessionLogin.response.headers.get("set-cookie") || "").match(/(?:^|;\\s*)session=([^;]+)/);
  assert.ok(expiredCookieMatch, "Expiry regression fixture must receive a session");
  const expiredSessionCookie = "session=" + expiredCookieMatch[1];
  executeLocalSql("UPDATE sessions SET expires_at=0 WHERE user_id=" + Number(owner.user.id));
  const expiredSessionMe = await request(baseUrl, "/api/me", { cookie: expiredSessionCookie });
  assert.equal(expiredSessionMe.response.status, 200);
  assert.equal(expiredSessionMe.data.user, null, "An expired session must not authenticate an otherwise active account");


  const resetRequestUnknown = await request(baseUrl,"/api/auth/password-reset/request",{method:"POST",body:{email:"missing" + suffix + "@example.test"}});
  assert.equal(resetRequestUnknown.response.status,202,"Unknown email addresses must receive the same generic accepted response");
  assert.equal(resetRequestUnknown.data.ok,true);
  const resetRequestExisting = await request(baseUrl,"/api/auth/password-reset/request",{method:"POST",body:{email:owner.user.email}});
  assert.equal(resetRequestExisting.response.status,202,"A missing delivery provider must not disclose whether an account exists");

  const resetToken = createPasswordResetToken();
  const resetHash = await hashPasswordResetToken(resetToken);
  const resetNow = new Date();
  const resetCreated = resetNow.toISOString();
  const resetExpiry = new Date(resetNow.getTime()+30*60*1000).toISOString();
  const seedReset = "INSERT INTO password_reset_tokens(user_id,email_snapshot,token_hash,purpose,created_at,expires_at) VALUES("+
    Number(owner.user.id)+",'" + owner.user.email + "','" + resetHash + "','password_reset','" + resetCreated + "','" + resetExpiry + "')";
  wrangler(["d1","execute",database,"--local","--persist-to",persist,"--command",seedReset]);
  const newPassword = "New-Recovery-Password-2026!";
  const resetComplete = await request(baseUrl,"/api/auth/password-reset/complete",{method:"POST",body:{token:resetToken,password:newPassword}});
  assert.equal(resetComplete.response.status,200,JSON.stringify(resetComplete.data));
  assert.equal(resetComplete.data.ok,true);
  const resetReplay = await request(baseUrl,"/api/auth/password-reset/complete",{method:"POST",body:{token:resetToken,password:"Another-Replay-Password-2026!"}});
  assert.equal(resetReplay.response.status,400,"Password reset tokens must be single-use");
  const oldSession = await request(baseUrl,"/api/me/export",{cookie:owner.cookie});
  assert.equal(oldSession.response.status,401,"Password reset must revoke all existing sessions for the account");
  const oldPasswordLogin = await request(baseUrl,"/api/auth/login",{method:"POST",body:{email:owner.user.email,password:"Integration-Test-Password-2026!"}});
  assert.equal(oldPasswordLogin.response.status,401,"Old password must no longer authenticate");
  const newPasswordLogin = await request(baseUrl,"/api/auth/login",{method:"POST",body:{email:owner.user.email,password:newPassword}});
  assert.equal(newPasswordLogin.response.status,200,"New password must authenticate after reset");
  const otherAccountAfterReset = await request(baseUrl,"/api/me/export",{cookie:recipient.cookie});
  assert.equal(otherAccountAfterReset.response.status,200,"Resetting one account must not revoke another account's session");
  const ownerSessionCookie=newPasswordLogin.response.headers.get("set-cookie")||"";
  const ownerSessionMatch=ownerSessionCookie.match(/(?:^|;\s*)session=([^;]+)/);
  assert.ok(ownerSessionMatch,"Re-authentication after password reset must issue a fresh session");
  owner.cookie="session="+ownerSessionMatch[1];

  const unauthenticatedDeletion=await request(baseUrl,"/api/me/deletion-request",{method:"POST",body:{password:newPassword}});
  assert.equal(unauthenticatedDeletion.response.status,401,"Deletion requests require authentication");
  const wrongDeletionPassword=await request(baseUrl,"/api/me/deletion-request",{method:"POST",cookie:owner.cookie,body:{password:"Incorrect-Password-2026!"}});
  assert.equal(wrongDeletionPassword.response.status,401,"Deletion requests require current-password re-authentication");
  const ownerDeletion=await request(baseUrl,"/api/me/deletion-request",{method:"POST",cookie:owner.cookie,body:{password:newPassword}});
  assert.equal(ownerDeletion.response.status,201,JSON.stringify(ownerDeletion.data));
  assert.equal(ownerDeletion.data.request.status,"review_required","Creator accounts must enter ownership review");
  const duplicateOwnerDeletion=await request(baseUrl,"/api/me/deletion-request",{method:"POST",cookie:owner.cookie,body:{password:newPassword}});
  assert.equal(duplicateOwnerDeletion.response.status,200);
  assert.equal(duplicateOwnerDeletion.data.request.requested_at,ownerDeletion.data.request.requested_at,"Repeated requests must be idempotent");
  const foreignCancel=await request(baseUrl,"/api/me/deletion-request/cancel",{method:"POST",cookie:recipient.cookie});
  assert.equal(foreignCancel.response.status,409,"Another account cannot cancel the owner request");
  const ownerCancel=await request(baseUrl,"/api/me/deletion-request/cancel",{method:"POST",cookie:owner.cookie});
  assert.equal(ownerCancel.response.status,200,JSON.stringify(ownerCancel.data));
  assert.equal(ownerCancel.data.request.status,"cancelled");
  const ownerNovelsAfterDeletionCancel=await request(baseUrl,"/api/author/novels",{cookie:owner.cookie});
  assert.ok(ownerNovelsAfterDeletionCancel.data.length>0,"Deletion requests must never delete creator novels");

  const readerDeletion=await request(baseUrl,"/api/me/deletion-request",{method:"POST",cookie:spectator.cookie,body:{password:"Integration-Test-Password-2026!"}});
  assert.equal(readerDeletion.response.status,201,JSON.stringify(readerDeletion.data));
  assert.ok(Number.isSafeInteger(Number(readerDeletion.data.request.id)) && Number(readerDeletion.data.request.id)>0,"Deletion request creation must return its stable database ID for reviewer-case correlation");
  assert.equal(readerDeletion.data.request.status,"pending_deletion","Non-creator accounts enter cooling-off state");

  // Account-deletion review claims are exercised through the real local Worker + isolated D1.
  const requestId=Number(readerDeletion.data.request.id);
  const missingOriginAssignment=await request(baseUrl,"/api/admin/account-deletion/reviewer-roles",{
    method:"POST",cookie:administrator.cookie,body:{user_id:moderator.user.id,role_key:"support_reviewer"}
  });
  assert.equal(missingOriginAssignment.response.status,403,"Reviewer role mutations must reject requests without same-origin proof");
  for (const [target,role] of [
    [moderator,"support_reviewer"],
    [recipient,"creator_rights_reviewer"],
    [spectator,"support_reviewer"]
  ]) {
    const assigned=await request(baseUrl,"/api/admin/account-deletion/reviewer-roles",{
      method:"POST",cookie:administrator.cookie,origin:baseUrl,
      body:{user_id:target.user.id,role_key:role}
    });
    assert.equal(assigned.response.status,201,JSON.stringify(assigned.data));
  }
  const unassignedQueue=await request(baseUrl,"/api/admin/account-deletion/reviews",{cookie:owner.cookie});
  assert.equal(unassignedQueue.response.status,403,"An unassigned account must not read the deletion review queue");
  const assignedQueue=await request(baseUrl,"/api/admin/account-deletion/reviews",{cookie:moderator.cookie});
  assert.equal(assignedQueue.response.status,200,JSON.stringify(assignedQueue.data));
  assert.ok(assignedQueue.data.reviews.some(row=>Number(row.request_id)===requestId),"The active deletion request must appear in the minimal review queue");
  const selfClaim=await request(baseUrl,"/api/admin/account-deletion/reviews/"+requestId+"/claim",{
    method:"POST",cookie:spectator.cookie,origin:baseUrl
  });
  assert.equal(selfClaim.response.status,409,"The requester must not claim their own deletion case");
  const claims=await Promise.all([
    request(baseUrl,"/api/admin/account-deletion/reviews/"+requestId+"/claim",{method:"POST",cookie:moderator.cookie,origin:baseUrl}),
    request(baseUrl,"/api/admin/account-deletion/reviews/"+requestId+"/claim",{method:"POST",cookie:recipient.cookie,origin:baseUrl})
  ]);
  assert.deepEqual(claims.map(x=>x.response.status).sort(),[200,409],"Exactly one competing reviewer must acquire the active lease");
  const winningClaim=claims.find(x=>x.response.status===200);
  assert.equal(winningClaim.data.ok,true);
  assert.equal(winningClaim.data.lease_minutes,10);
  const reviewId=Number(winningClaim.data.review.id);
  executeLocalSql("UPDATE account_deletion_reviews SET claim_expires_at='2000-01-01T00:00:00.000Z',version=version+1 WHERE id="+reviewId);
  const takeoverReviewer=claims[0].response.status===200?recipient:moderator;
  const takeover=await request(baseUrl,"/api/admin/account-deletion/reviews/"+requestId+"/claim",{
    method:"POST",cookie:takeoverReviewer.cookie,origin:baseUrl
  });
  assert.equal(takeover.response.status,200,JSON.stringify(takeover.data));
  assert.equal(Number(takeover.data.review.version),Number(winningClaim.data.review.version)+2,
    "Expired-lease takeover must increment the review version");
  assert.equal(takeover.data.review.claimed_by,takeoverReviewer.user.id,
    "Expired-lease takeover must assign the case to the second reviewer");
  const repeatClaim=await request(baseUrl,"/api/admin/account-deletion/reviews/"+requestId+"/claim",{
    method:"POST",cookie:moderator.cookie,origin:baseUrl
  });
  assert.equal(repeatClaim.response.status,409,"An unexpired lease must block a second claim");
  const roleList=await request(baseUrl,"/api/admin/account-deletion/reviewer-roles",{cookie:administrator.cookie});
  assert.equal(roleList.response.status,200);
  const moderatorAssignment=roleList.data.assignments.find(row=>Number(row.user_id)===Number(moderator.user.id)&&row.role_key==="support_reviewer"&&!row.revoked_at);
  assert.ok(moderatorAssignment,"Reviewer assignment must be visible to administrators");
  const revoke=await request(baseUrl,"/api/admin/account-deletion/reviewer-roles/"+moderatorAssignment.id+"/revoke",{
    method:"POST",cookie:administrator.cookie,origin:baseUrl
  });
  assert.equal(revoke.response.status,200,JSON.stringify(revoke.data));
  const revokedQueue=await request(baseUrl,"/api/admin/account-deletion/reviews",{cookie:moderator.cookie});
  assert.equal(revokedQueue.response.status,403,"Revoked reviewers must lose queue access immediately");
  const readerCancel=await request(baseUrl,"/api/me/deletion-request/cancel",{method:"POST",cookie:spectator.cookie});
  assert.equal(readerCancel.response.status,200);
  assert.equal(readerCancel.data.request.status,"cancelled");

  console.log("Local Worker/D1 authorization integration passed: account export two-user isolation and rate limits, administrator role boundaries, ban/login/session revocation, private chapter read/publish isolation, six private-data endpoint isolation, session-bound writes, ownership and chapter isolation, recipient privacy, concurrent acceptance, rejection/cancellation, and ineligible transfer rejection.");

} catch (error) {
  console.error(error);
  if (workerOutput) console.error(workerOutput);
  process.exitCode = 1;
} finally {
  if (worker && worker.exitCode === null) {
    try {
      if (process.platform !== "win32" && worker.pid) process.kill(-worker.pid, "SIGTERM");
      else worker.kill("SIGTERM");
    } catch {}
    await new Promise(resolve => {
      const timeout = setTimeout(resolve, 5000);
      worker.once("exit", () => { clearTimeout(timeout); resolve(); });
    });
    worker.stdout?.destroy();
    worker.stderr?.destroy();
  }
  await rm(temp, { recursive: true, force: true });
}
