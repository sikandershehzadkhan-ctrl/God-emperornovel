export const READER_SESSION_VERSION = 1;

const safeId = value => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const clampPercent = value => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(100, Math.max(0, number)) : 0;
};

const sessionKey = (novelId, chapterNumber) =>
  `imperial:reader-session:v${READER_SESSION_VERSION}:${novelId}:${chapterNumber}`;

export function createReaderSessionStore(storage) {
  if (!storage || typeof storage.getItem !== "function" ||
      typeof storage.setItem !== "function" || typeof storage.removeItem !== "function") {
    throw new TypeError("A Storage-compatible adapter is required.");
  }

  function identity(novelId, chapterNumber) {
    const novel = safeId(novelId);
    const chapter = safeId(chapterNumber);
    if (!novel || !chapter) throw new TypeError("Novel and chapter IDs must be positive integers.");
    return { novel, chapter, key: sessionKey(novel, chapter) };
  }

  return Object.freeze({
    read(novelId, chapterNumber) {
      const target = identity(novelId, chapterNumber);
      let raw;
      try { raw = storage.getItem(target.key); } catch { return null; }
      if (!raw) return null;
      try {
        const value = JSON.parse(raw);
        if (!value || value.version !== READER_SESSION_VERSION ||
            value.novelId !== target.novel || value.chapterNumber !== target.chapter ||
            !Number.isFinite(Number(value.updatedAt))) return null;
        return Object.freeze({
          version: READER_SESSION_VERSION,
          novelId: target.novel,
          chapterNumber: target.chapter,
          progress: clampPercent(value.progress),
          updatedAt: Math.max(0, Number(value.updatedAt))
        });
      } catch { return null; }
    },

    write(novelId, chapterNumber, progress, updatedAt = Date.now()) {
      const target = identity(novelId, chapterNumber);
      const timestamp = Number(updatedAt);
      const session = {
        version: READER_SESSION_VERSION,
        novelId: target.novel,
        chapterNumber: target.chapter,
        progress: clampPercent(progress),
        updatedAt: Number.isFinite(timestamp) ? Math.max(0, timestamp) : Date.now()
      };
      try { storage.setItem(target.key, JSON.stringify(session)); }
      catch { return false; }
      return true;
    },

    clear(novelId, chapterNumber) {
      const target = identity(novelId, chapterNumber);
      try { storage.removeItem(target.key); return true; }
      catch { return false; }
    }
  });
}

export function getScrollProgress({ scrollTop = 0, scrollHeight = 0, viewportHeight = 0 } = {}) {
  const top = Number(scrollTop);
  const height = Number(scrollHeight);
  const viewport = Number(viewportHeight);
  if (![top, height, viewport].every(Number.isFinite)) return 0;
  const maximum = Math.max(0, height - Math.max(0, viewport));
  if (maximum === 0) return 100;
  return Math.round(clampPercent((Math.max(0, top) / maximum) * 100));
}

export function createNavigationEpoch() {
  let epoch = 0;
  return Object.freeze({
    begin() { epoch += 1; return epoch; },
    isCurrent(token) { return Number.isSafeInteger(token) && token === epoch; },
    invalidate() { epoch += 1; return epoch; }
  });
}
