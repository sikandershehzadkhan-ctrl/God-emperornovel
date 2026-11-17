const CACHE='imperial-novel-v17.23.0-reader-static-cache-1';
const CORE=['/','/imperial-design-system.css','/manifest-17.23.0.webmanifest','/app-17.23.0.js','/reader-session.mjs','/reader-offline.mjs','/imperial-novel-app-icon.svg'];
const STATIC_ASSET=/\.(?:css|js|mjs|svg|png|jpe?g|webp|avif|woff2?|webmanifest)$/i;
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('imperial-novel-')&&key!==CACHE&&!key.startsWith('imperial-novel-offline-chapters-')).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 if(request.mode==='navigate'){
  if(url.pathname!=='/')return;
  event.respondWith(fetch(request).catch(()=>caches.match('/')));
  return;
 }
 if(!STATIC_ASSET.test(url.pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const response=await fetch(request);
   const cacheControl=response.headers.get('cache-control')||'';
   if(response.ok&&response.type==='basic'&&!/private|no-store/i.test(cacheControl))await cache.put(request,response.clone());
   return response;
  }catch(error){
   const cached=await cache.match(request);
   if(cached)return cached;
   throw error;
  }
 })());
});
