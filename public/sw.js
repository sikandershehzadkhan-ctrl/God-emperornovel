const CACHE='imperial-novel-v17.21.0';
const CORE=['/','/manifest-17.21.0.webmanifest','/style-17.21.0.css','/app-17.21.0.css','/imperial-luxury-17.21.0.css','/imperial-formats-17.21.0.css','/imperial-comic-reader-17.21.0.css','/imperial-glass.css','/app-17.21.0.js','/imperial-novel-app-icon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('imperial-novel-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).pathname.startsWith('/api/'))return;event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));});
