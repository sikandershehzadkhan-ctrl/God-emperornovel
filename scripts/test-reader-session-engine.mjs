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
assert.equal(sessions.write(12, 4, 150, 1), true);
assert.equal(sessions.read(12, 4).progress, 100, "progress must clamp at 100");
assert.equal(sessions.write(12, 4, -20, 1), true);
assert.equal(sessions.read(12, 4).progress, 0, "progress must clamp at zero");
assert.equal(sessions.clear(12, 4), true);
assert.equal(sessions.read(12, 4), null);
assert.throws(() => sessions.write(0, 1, 10), /positive integers/);

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
assert.match(readerSource, /readerSessions\.write\(id,num,pct\)/, "scroll progress must persist through the session engine");
assert.match(readerSource, /navigation\.isCurrent\(navigationToken\)/, "stale chapter responses must be rejected");
assert.doesNotMatch(readerSource, /if\(d\.unlocked\)api\(['"]\/api\/bookmark['"]/, "opening a chapter must not silently bookmark it");

console.log("Reader session engine and route integration checks passed.");
