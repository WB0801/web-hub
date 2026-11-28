const CACHE='shuttle-dynasty-v2.9.1';
const ROOT=new URL('./',self.location.href);
const FILES=['./','index.html','logo.svg','home-hero.webp','founder-male.webp','founder-female.webp','icon.svg','icon-180.png','icon-192.png','icon-512.png','manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil((async()=>{const c=await caches.open(CACHE);await c.addAll(FILES.map(x=>new Request(new URL(x,ROOT).href,{cache:'reload'})));await Promise.allSettled(['en','zh'].flatMap(l=>['json','wav'].map(ext=>c.add(new Request(new URL('referee/'+l+'.'+ext,ROOT).href,{cache:'reload'})))));await self.skipWaiting()})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('shuttle-dynasty-')&&k!==CACHE)await caches.delete(k);await self.clients.claim()})()));
async function networkFirst287(request,cache,key){
 let response;
 try{response=await fetch(request,{cache:request.mode==='navigate'?'no-store':'default'})}catch(err){}
 if(response?.ok){try{await cache.put(key,response.clone())}catch(err){}return response}
 try{let fallback=await cache.match(key,{ignoreSearch:true});if(fallback)return fallback}catch(err){}
 return response||Response.error()
}
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==ROOT.origin||!u.pathname.startsWith(ROOT.pathname))return;if(u.searchParams.has('sd-update-check')){e.respondWith(fetch(e.request,{cache:'no-store'}));return}e.respondWith((async()=>{let c;try{c=await caches.open(CACHE)}catch(err){try{return await fetch(e.request)}catch(err){return Response.error()}}const key=e.request.mode==='navigate'?new URL('index.html',ROOT).href:e.request;return networkFirst287(e.request,c,key)})())});
self.addEventListener('message',e=>{if(e.data?.type==='SD_CACHE_VERSION'&&e.ports?.[0])e.ports[0].postMessage({type:'SD_CACHE_VERSION',cache:CACHE})});
