import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseURL = (process.env.IMPERIAL_PRODUCTION_URL || "https://god-emperornovel.sikandershehzadkhan.workers.dev").replace(/\/$/, "");
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", error => pageErrors.push(error.message));

async function open(path) {
  const response = await page.goto(baseURL + path, { waitUntil: "domcontentloaded", timeout: 30000 });
  assert.ok(response && response.ok(), `production ${path} must return a successful document response`);
  await page.locator("#app").waitFor({ timeout: 15000 });
  return page.locator("#app");
}

async function noOverflow(label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  assert.equal(overflow, false, `production ${label} must not overflow horizontally at 360px`);
}

try {
  const healthResponse = await page.request.get(baseURL + "/api/health", { timeout: 20000 });
  assert.equal(healthResponse.status(), 200, "production health endpoint must return HTTP 200");
  const health = await healthResponse.json();
  assert.equal(health.ok, true, "production Worker health must be healthy");
  assert.equal(health.database, true, "production D1 health must be connected");

  const formatResponse = await page.request.get(baseURL + "/api/formats", { timeout: 20000 });
  assert.equal(formatResponse.status(), 200, "production format registry must return HTTP 200");
  const registry = await formatResponse.json();
  assert.ok(Array.isArray(registry.formats) && registry.formats.length >= 15, "production must expose at least 15 registered formats");

  let app = await open("/");
  await page.locator(".nextHero h1").waitFor({ timeout: 20000 });
  assert.match(await app.innerText(), /Open a world/i, "production homepage must render its hero");
  await noOverflow("homepage");

  app = await open("/formats");
  await page.getByRole("heading", { name: "Explore by Format" }).waitFor({ timeout: 20000 });
  assert.ok(await page.locator(".formatLink").count() >= 15, "production Formats route must render all format links");
  assert.doesNotMatch(await app.innerText(), /Your next world is loading/i, "production Formats route must leave its boot fallback");
  await noOverflow("Formats");

  app = await open("/catalog");
  await page.getByRole("heading", { name: "Discover your next world" }).waitFor({ timeout: 20000 });
  await page.waitForFunction(() => {
    const el = document.querySelector("#resultCount");
    return el && el.textContent.trim() && el.textContent.trim() !== "Loading catalog...";
  }, { timeout: 20000 });
  await noOverflow("catalog");

  app = await open("/author");
  await page.getByRole("heading", { name: "Author Studio" }).waitFor({ timeout: 20000 });
  await page.locator("#createStoryForm").waitFor({ timeout: 10000 });
  await noOverflow("Author Studio");

  app = await open("/tickets");
  await page.getByRole("heading", { name: "Imperial Crown Vault" }).waitFor({ timeout: 20000 });
  await page.getByRole("link", { name: "Sign in" }).waitFor({ timeout: 10000 });
  await noOverflow("Crown Vault");

  assert.deepEqual(pageErrors, [], "production routes must not emit uncaught JavaScript errors");
  console.log("PASS: read-only production browser smoke for health, D1, 15+ formats, homepage, Formats, Catalog, Author Studio and Crown Vault at 360px.");
} finally {
  await browser.close();
}
