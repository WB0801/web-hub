const CACHE='shuttle-dynasty-v3.0.0';
const ROOT=new URL('./',self.location.href);
const INDEX=new URL('index.html',ROOT).href,VERSION=CACHE.slice('shuttle-dynasty-v'.length);
const FILES=['logo.svg','home-hero.webp','founder-male.webp','founder-female.webp','icon.svg','icon-180.png','icon-192.png','icon-512.png','manifest.webmanifest'];
function htmlVersion300(text){return /\bconst\s+VERSION\s*=\s*['"](\d+\.\d+(?:\.\d+){0,3})['"]/.exec(text)?.[1]||null}
function compareVersion300(a,b){if(!a||!b)return null;let x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<Math.max(x.length,y.length);i++){let d=(x[i]||0)-(y[i]||0);if(d)return Math.sign(d)}return 0}
async function responseVersion300(r){try{return r?.ok?htmlVersion300(await r.clone().text()):null}catch(e){return null}}
self.addEventListener('install',e=>e.waitUntil((async()=>{
 const req=new Request(INDEX,{cache:'reload'}),html=await fetch(req,{cache:'no-store'});
 if(await responseVersion300(html)!==VERSION)throw Error('Release files not synchronized');
 const c=await caches.open(CACHE);await c.addAll(FILES.map(x=>new Request(new URL(x,ROOT).href,{cache:'reload'})));await c.put(INDEX,html);
 await Promise.allSettled(['en-female','en-male','zh-female','zh-male'].flatMap(l=>['json','wav'].map(ext=>c.add(new Request(new URL('referee/neural-v1/'+l+'.'+ext,ROOT).href,{cache:'reload'})))));
 await self.skipWaiting()
})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('shuttle-dynasty-')&&k!==CACHE)await caches.delete(k);await self.clients.claim()})()));
async function navigation300(request,cache){
 let response;try{response=await fetch(request,{cache:'no-store'})}catch(e){}
 let fallback;try{fallback=await cache.match(INDEX,{ignoreSearch:true})}catch(e){}
 let fresh=await responseVersion300(response),old=await responseVersion300(fallback);
 if(fresh&&compareVersion300(fresh,VERSION)>=0&&(!old||compareVersion300(fresh,old)>=0)){try{await cache.put(INDEX,response.clone())}catch(e){}return response}
 if(old)return fallback;
 return response||Response.error()
}
async function networkFirst287(request,cache,key){
 let response;try{response=await fetch(request)}catch(err){}
 if(response?.ok){try{await cache.put(key,response.clone())}catch(err){}return response}
 try{let fallback=await cache.match(key,{ignoreSearch:true});if(fallback)return fallback}catch(err){}
 return response||Response.error()
}
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==ROOT.origin||!u.pathname.startsWith(ROOT.pathname))return;if(u.searchParams.has('sd-update-check')){e.respondWith(fetch(e.request,{cache:'no-store'}));return}e.respondWith((async()=>{let c;try{c=await caches.open(CACHE)}catch(err){try{return await fetch(e.request)}catch(err){return Response.error()}}return e.request.mode==='navigate'?navigation300(e.request,c):networkFirst287(e.request,c,e.request)})())});
self.addEventListener('message',e=>{if(e.data?.type==='SD_CACHE_VERSION'&&e.ports?.[0])e.ports[0].postMessage({type:'SD_CACHE_VERSION',cache:CACHE})});
