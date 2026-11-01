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
  const promote = "UPDATE users SET role='author' WHERE id IN (" + Number(owner.user.id) + "," + Number(recipient.user.id) + ")";
  wrangler(["d1", "execute", database, "--local", "--persist-to", persist, "--command", promote]);

  const acceptedNovel = await createNovel(baseUrl, owner.cookie, "Ownership Integration Accepted");
  const lookup = await request(baseUrl, "/api/author/eligible-recipients?username=" + encodeURIComponent(recipient.user.username), { cookie: owner.cookie });
  assert.equal(lookup.response.status, 200, JSON.stringify(lookup.data));
  assert.equal(Number(lookup.data.id), Number(recipient.user.id));
  const invitation = await request(baseUrl, "/api/author/novels/" + acceptedNovel + "/ownership-transfer", {
    method: "POST", cookie: owner.cookie, body: { recipient_user_id: recipient.user.id, request_note: "Local integration test" }
  });
  assert.equal(invitation.response.status, 201, JSON.stringify(invitation.data));
  const transferId = Number(invitation.data.transfer_id);

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

  console.log("Two-account local Worker/D1 integration passed: registration/login, recipient privacy, invitation, concurrent acceptance, former-owner novel/chapter access revocation, recipient write access, wrong-actor denial, rejection, and cancellation.");
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
