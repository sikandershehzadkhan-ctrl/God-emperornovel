const CACHE='imperial-novel-v17.17.0';
const CORE=['/','/manifest-17.17.0.webmanifest','/style-17.17.0.css','/app-17.17.0.css','/imperial-luxury-17.17.0.css','/imperial-formats-17.17.0.css','/imperial-comic-reader-17.17.0.css','/app-17.17.0.js','/imperial-novel-crest-17.18.0.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('imperial-novel-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).pathname.startsWith('/api/'))return;event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));});
