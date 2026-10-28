const CACHE='imperial-novel-v17.4.0';
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/','/manifest-17.4.0.webmanifest']))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).pathname.startsWith('/api/'))return;e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));});
