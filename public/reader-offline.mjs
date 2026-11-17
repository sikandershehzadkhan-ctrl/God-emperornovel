export const OFFLINE_CHAPTER_CACHE = 'imperial-novel-offline-chapters-v1';
export const OFFLINE_CHAPTER_LIMIT = 25;
export const OFFLINE_CHAPTER_MAX_BYTES = 2 * 1024 * 1024;
export const OFFLINE_TOTAL_MAX_BYTES = 20 * 1024 * 1024;

const safeId = value => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};
const chapterKey = (novelId, chapterNumber) =>
  `/__imperial_offline__/chapter/${novelId}/${chapterNumber}`;

export function createOfflineChapterStore(cacheStorage) {
  if (!cacheStorage || typeof cacheStorage.open !== 'function') {
    throw new TypeError('CacheStorage is required for offline chapters.');
  }

  async function cache() {
    return cacheStorage.open(OFFLINE_CHAPTER_CACHE);
  }

  return Object.freeze({
    async list() {
      const store = await cache();
      const keys = await store.keys();
      const records = [];
      for (const request of keys) {
        const segments = new URL(request.url).pathname.split('/');
        if (segments.length !== 5 || segments[1] !== '__imperial_offline__' || segments[2] !== 'chapter' || !safeId(segments[3]) || !safeId(segments[4])) continue;
        if (!match) continue;
        try {
          const response = await store.match(request);
          if (!response) continue;
          const value = await response.json();
          if (value?.version !== 1 || !safeId(value.novel?.id) ||
              !safeId(value.chapter?.chapter_number) || typeof value.chapter?.content !== 'string') continue;
          records.push({
            novelId: Number(value.novel.id),
            chapterNumber: Number(value.chapter.chapter_number),
            novelTitle: String(value.novel.title || 'Untitled novel'),
            chapterTitle: String(value.chapter.title || `Chapter ${value.chapter.chapter_number}`),
            savedAt: Number(value.savedAt) || 0,
            sizeBytes: Number(value.sizeBytes) || 0
          });
        } catch { /* Ignore damaged local cache entries. */ }
      }
      return records.sort((a,b)=>b.savedAt-a.savedAt);
    },

    async get(novelId, chapterNumber) {
      const novel = safeId(novelId), chapter = safeId(chapterNumber);
      if (!novel || !chapter) return null;
      const store = await cache();
      const response = await store.match(chapterKey(novel, chapter));
      if (!response) return null;
      try {
        const value = await response.json();
        if (value?.version !== 1 || Number(value.novel?.id) !== novel ||
            Number(value.chapter?.chapter_number) !== chapter ||
            value.chapter?.unlocked !== true || value.chapter?.offlineAllowed !== true || typeof value.chapter?.content !== 'string') return null;
        return value;
      } catch { return null; }
    },

    async save({ novel, chapter }) {
      const novelId = safeId(novel?.id);
      const chapterNumber = safeId(chapter?.chapter_number);
      if (!novelId || !chapterNumber || chapter?.unlocked !== true || chapter?.offlineAllowed !== true ||
          typeof chapter.content !== 'string' || !chapter.content.trim()) {
        return { ok:false, reason:'not-authorized' };
      }
      const sizeBytes = new TextEncoder().encode(chapter.content).byteLength;
      if (sizeBytes > OFFLINE_CHAPTER_MAX_BYTES) return { ok:false, reason:'chapter-too-large' };
      const store = await cache();
      const key = chapterKey(novelId, chapterNumber);
      const existing = await store.match(key);
      const current = await this.list();
      const currentBytes = current.reduce((sum,item)=>sum+item.sizeBytes,0);
      const existingRecord = current.find(item=>item.novelId===novelId&&item.chapterNumber===chapterNumber);
      if (!existing && current.length >= OFFLINE_CHAPTER_LIMIT) return { ok:false, reason:'chapter-limit' };
      if (currentBytes - Number(existingRecord?.sizeBytes||0) + sizeBytes > OFFLINE_TOTAL_MAX_BYTES) {
        return { ok:false, reason:'storage-limit' };
      }
      const record = {
        version:1,
        savedAt:Date.now(),
        sizeBytes,
        novel:{id:novelId,title:String(novel.title||'Untitled novel').slice(0,240),author:String(novel.author||'').slice(0,160),kind:String(novel.kind||'text').slice(0,40),totalChapters:Math.max(1,Number(novel.totalChapters)||1)},
        chapter:{id:safeId(chapter.id),novel_id:novelId,chapter_number:chapterNumber,title:String(chapter.title||`Chapter ${chapterNumber}`).slice(0,240),unlocked:true,offlineAllowed:true,content:chapter.content}
      };
      try {
        await store.put(key,new Response(JSON.stringify(record),{headers:{'content-type':'application/json;charset=UTF-8'}}));
        return {ok:true,sizeBytes};
      } catch {
        return {ok:false,reason:'device-storage-unavailable'};
      }
    },

    async remove(novelId, chapterNumber) {
      const novel = safeId(novelId), chapter = safeId(chapterNumber);
      if (!novel || !chapter) return false;
      const store = await cache();
      return store.delete(chapterKey(novel,chapter));
    }
  });
}
