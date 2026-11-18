import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  READER_SESSION_VERSION,
  createReaderSessionStore,
  createNavigationEpoch,
  getScrollProgress
} from "../src/reader-session.mjs";

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    values
  };
}

const storage = memoryStorage();
const sessions = createReaderSessionStore(storage);
assert.equal(sessions.write(12, 4, 37, 1700000000000), true);
assert.deepEqual(sessions.read(12, 4), {
  version: READER_SESSION_VERSION,
  novelId: 12,
  chapterNumber: 4,
  progress: 37,
  updatedAt: 1700000000000
});
assert.equal(sessions.read(12, 5), null, "progress must not leak between chapters");
assert.equal(sessions.read(13, 4), null, "progress must not leak between novels");
const accountA = "12:account:reader-100";
const accountB = "12:account:reader-200";
assert.equal(sessions.write(accountA, 4, 62, 1700000000001), true, "account-scoped novel keys must be accepted");
assert.equal(sessions.read(accountA, 4).progress, 62, "signed-in reader progress must restore from its account namespace");
assert.equal(sessions.read(accountB, 4), null, "progress must not leak between signed-in accounts");
assert.equal(sessions.read(12, 4).progress, 37, "signed-in writes must not overwrite the guest progress namespace");
assert.throws(() => sessions.write("12:account:reader-100/unsafe", 4, 20), /valid/, "unsafe account namespaces must be rejected");

assert.equal(sessions.write(12, 4, 150, 1), true);
assert.equal(sessions.read(12, 4).progress, 100, "progress must clamp at 100");
assert.equal(sessions.write(12, 4, -20, 1), true);
assert.equal(sessions.read(12, 4).progress, 0, "progress must clamp at zero");
assert.equal(sessions.clear(12, 4), true);
assert.equal(sessions.read(12, 4), null);
assert.throws(() => sessions.write(0, 1, 10), /valid/);
assert.throws(() => sessions.read(1, 0), /valid/);

const unavailableStorage = {
  getItem() { throw new Error("storage access denied"); },
  setItem() { throw new Error("storage quota or access denied"); },
  removeItem() { throw new Error("storage access denied"); }
};
const unavailableSessions = createReaderSessionStore(unavailableStorage);
assert.equal(unavailableSessions.read(12, 4), null, "unavailable storage reads must fail safely");
assert.equal(unavailableSessions.write(12, 4, 50), false, "failed persistence must be reported without crashing the reader");
assert.equal(unavailableSessions.clear(12, 4), false, "failed removal must be reported without crashing the reader");

storage.setItem("imperial:reader-session:v1:12:4", "{broken");
assert.equal(sessions.read(12, 4), null, "corrupt local state must fail closed");
storage.setItem("imperial:reader-session:v1:12:4", JSON.stringify({
  version: 99, novelId: 12, chapterNumber: 4, progress: 40, updatedAt: 1
}));
assert.equal(sessions.read(12, 4), null, "unknown session versions must be ignored");

assert.equal(getScrollProgress({ scrollTop: 50, scrollHeight: 200, viewportHeight: 100 }), 50);
assert.equal(getScrollProgress({ scrollTop: 500, scrollHeight: 200, viewportHeight: 100 }), 100);
assert.equal(getScrollProgress({ scrollTop: -10, scrollHeight: 200, viewportHeight: 100 }), 0);
assert.equal(getScrollProgress({ scrollTop: 0, scrollHeight: 100, viewportHeight: 100 }), 100);
assert.equal(getScrollProgress({ scrollTop: NaN, scrollHeight: 200, viewportHeight: 100 }), 0);

const navigation = createNavigationEpoch();
const first = navigation.begin();
const second = navigation.begin();
assert.equal(navigation.isCurrent(first), false, "late responses from old navigation must be discarded");
assert.equal(navigation.isCurrent(second), true);
navigation.invalidate();
assert.equal(navigation.isCurrent(second), false);

const readerSource = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
assert.match(readerSource, /import\(['"]\/reader-session\.mjs['"]\)/, "reader route must load the session engine");
assert.match(readerSource, /readerSessions\.write\(sessionNovelKey,num,pct\)/, "scroll progress must persist through the session engine");
assert.match(readerSource, /pct!==lastSavedProgress&&readerSessions\.write\(sessionNovelKey,num,pct\)/, "scroll progress must only be persisted when the integer percentage changes and a write succeeds.");
assert.match(readerSource, /pct!==lastRenderedProgress/, "progress DOM updates must be skipped when the displayed percentage has not changed.");
assert.match(readerSource, /navigation\.isCurrent\(navigationToken\)/, "stale chapter responses must be rejected");
assert.match(readerSource, /!navigation\.isCurrent\(navigationToken\)/, "stale scroll callbacks must not overwrite the active chapter session");
assert.doesNotMatch(readerSource, /if\(d\.unlocked\)api\(['"]\/api\/bookmark['"]/, "opening a chapter must not silently bookmark it");

console.log("Reader session engine and route integration checks passed.");
