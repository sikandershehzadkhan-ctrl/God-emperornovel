import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseURL = (process.env.IMPERIAL_BASE_URL || "http://127.0.0.1:8787").replace(/\/$/, "");
const browser = await chromium.launch({ headless: true });
const mobileContext = await browser.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await mobileContext.newPage();
const pageErrors = [];
page.on("pageerror", error => pageErrors.push(error.message));

async function open(path) {
  const response = await page.goto(baseURL + path, { waitUntil: "domcontentloaded", timeout: 30000 });
  assert.ok(response && response.ok(), `${path} should return a successful document response`);
  await page.locator("#app").waitFor({ timeout: 15000 });
  return page.locator("#app");
}

async function assertNoMobileOverflow(label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  assert.equal(overflow, false, `${label} must not create horizontal page overflow at 390px`);
}

try {
  const healthResponse = await page.request.get(baseURL + "/api/health", { timeout: 20000 });
  assert.equal(healthResponse.status(), 200, "local Worker health endpoint must return HTTP 200");
  const health = await healthResponse.json();
  assert.equal(health.ok, true, "local D1 must be reachable");

  const formatsResponse = await page.request.get(baseURL + "/api/formats", { timeout: 20000 });
  assert.equal(formatsResponse.status(), 200, "format registry API must return HTTP 200");
  const registry = await formatsResponse.json();
  assert.ok(Array.isArray(registry.formats) && registry.formats.length >= 15, "format registry must expose the supported format catalogue");

  let app = await open("/");
  await page.locator(".nextHero h1").waitFor({ timeout: 20000 });
  assert.match(await app.innerText(), /Open a world/i, "homepage hero must render real application content");
  await assertNoMobileOverflow("Homepage");

  app = await open("/formats");
  await page.getByRole("heading", { name: "Explore by Format" }).waitFor({ timeout: 20000 });
  assert.ok(await page.locator(".formatLink").count() >= 15, "Formats page must render the registered format links");
  assert.doesNotMatch(await app.innerText(), /Your next world is loading/i, "Formats page must leave the loading fallback");
  await assertNoMobileOverflow("Formats page");

  await page.locator(".formatLink").first().click();
  await page.locator(".formatProfile").waitFor({ timeout: 15000 });
  assert.ok(await page.locator("#formatResults").count() === 1, "format landing page must render its results container");

  app = await open("/catalog");
  await page.getByRole("heading", { name: "Discover your next world" }).waitFor({ timeout: 20000 });
  await page.locator("#resultCount").waitFor({ timeout: 15000 });
  await page.waitForFunction(() => {
    const el = document.querySelector("#resultCount");
    return el && el.textContent.trim() && el.textContent.trim() !== "Loading catalog...";
  }, { timeout: 20000 });
  assert.ok(await page.locator("#cf select[name=kind]").count() === 1, "catalog format filter must be present");
  await assertNoMobileOverflow("Catalog page");

  app = await open("/omniportal");
  await page.getByRole("heading", { name: "OmniPortal" }).waitFor({ timeout: 20000 });
  await page.locator("#tvmazeSearch").waitFor({ timeout: 10000 });
  await page.locator('#tvmazeSearch input[name="q"]').fill("Game of Thrones");
  await page.locator("#tvmazeSearch button[type=submit]").click();
  const tvmazeResult = page.locator(".tvmazeResult").filter({ hasText: "Game of Thrones" }).first();
  await tvmazeResult.waitFor({ timeout: 20000 });
  const resultText = await tvmazeResult.innerText();
  assert.match(resultText, /TVmaze/i, "screen metadata card must identify its provider");
  assert.match(resultText, /CC BY-SA/i, "screen metadata card must display its share-alike attribution");
  assert.ok(await tvmazeResult.locator('a[href^="https://www.tvmaze.com/"]').count() >= 1, "screen metadata must link to the source record");
  await assertNoMobileOverflow("OmniPortal");

  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const desktopPage = await desktopContext.newPage();
  desktopPage.on("pageerror", error => pageErrors.push(error.message));
  await desktopPage.goto(baseURL + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await desktopPage.locator(".nextHero h1").waitFor({ timeout: 20000 });
  const desktopHomeOverflow = await desktopPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  assert.equal(desktopHomeOverflow, false, "desktop homepage must not create horizontal overflow at 1440px");
  await desktopPage.goto(baseURL + "/formats", { waitUntil: "domcontentloaded", timeout: 30000 });
  await desktopPage.getByRole("heading", { name: "Explore by Format" }).waitFor({ timeout: 20000 });
  const desktopFormatsOverflow = await desktopPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  assert.equal(desktopFormatsOverflow, false, "desktop Formats page must not create horizontal overflow at 1440px");

  assert.deepEqual(pageErrors, [], "browser routes must not emit uncaught JavaScript page errors");
  console.log("PASS: local Worker/D1 health, 15+ format registry, mobile (360px Android emulation), desktop (1440px), homepage, formats directory, format landing, catalog filters, overflow checks and live TVmaze browser search.");
} finally {
  await browser.close();
}
