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

  const suffix = (String(process.pid) + String(Date.now())).slice(-8);
  const owner = await account(baseUrl, "owner" + suffix, "owner" + suffix + "@example.test");
  const recipient = await account(baseUrl, "author" + suffix, "author" + suffix + "@example.test");
  const spectator = await account(baseUrl, "reader" + suffix, "reader" + suffix + "@example.test");
  const moderator = await account(baseUrl, "moderator" + suffix, "moderator" + suffix + "@example.test");
  const administrator = await account(baseUrl, "administrator" + suffix, "administrator" + suffix + "@example.test");
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
  spectator.cookie = "session=" + (freshReaderLogin.response.headers.get("set-cookie") || "").match(/(?:^|;\\s*)session=([^;]+)/)?.[1];
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

  console.log("Local Worker/D1 authorization integration passed: administrator role boundaries, ban/login/session revocation, six private-data endpoint isolation, session-bound writes, ownership and chapter isolation, recipient privacy, concurrent acceptance, rejection/cancellation, and ineligible transfer rejection.");

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
