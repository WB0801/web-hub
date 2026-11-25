import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const out='qa-artifacts';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const errors=[],checks=[],frames=[];
const record=(name,details={})=>{checks.push({name,...details});console.log('PASS',name,JSON.stringify(details))};
const url='http://127.0.0.1:8765/rift-fleet/';
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
page.on('dialog',d=>d.accept());
const state=()=>page.evaluate(()=>JSON.parse(JSON.stringify(window.__riftGame.getState(),(k,v)=>k==='battle'?undefined:v)));
const shot=name=>page.screenshot({path:out+'/'+name+'.png',fullPage:true});
const phase=async p=>page.waitForFunction(p=>window.__riftGame?.getState()?.phase===p,p,{timeout:45000});
const drag=async (a,b)=>{await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:18});await page.mouse.up()};
const center=async loc=>{const b=await loc.boundingBox();assert(b,'missing visible bounding box');return {x:b.x+b.width/2,y:b.y+b.height/2}};
const boardPoint=async i=>{const b=await page.locator('#battleCanvas').boundingBox();assert(b);return {x:b.x+(54+(i%7+.5)*105)/840*b.width,y:b.y+(20+(3+Math.floor(i/7)+.5)*81)/530*b.height}};
try{
 await page.goto(url,{waitUntil:'load'});await page.waitForFunction(()=>!!window.__riftGame);
 await shot('01-menu');record('boot');
 await page.locator('#opponentCount').selectOption('7');
 await page.locator('#newBtn').click();await phase('prep');
 if(await page.locator('#coachSkip').isVisible())await page.locator('#coachSkip').click();
 let g=await state();assert.equal(g.enemies.length,7);assert.equal(g.player.board.filter(Boolean).length,2);
 await shot('02-prep');record('eight-player new game');
 const buy=page.locator('[data-shop]:not([disabled])').first();await buy.waitFor();
 const gold=g.player.gold,bought=g.stats.bought;await buy.click();g=await state();
 assert.equal(g.stats.bought,bought+1);assert(g.player.gold<gold);record('shop purchase');
 const bi=g.player.bench.findIndex(Boolean),empty=g.player.board.findIndex(x=>!x),uid=g.player.bench[bi]?.uid;
 assert(uid);await drag(await center(page.locator('[data-bench="'+bi+'"]')),await boardPoint(empty));
 g=await state();assert.equal(g.player.board[empty]?.uid,uid);record('pointer drag deploy');
 if(g.player.gold>=2){const old=g.player.gold;await page.locator('#rerollBtn').click();assert.equal((await state()).player.gold,old-2);record('paid reroll')}
 await page.locator('[data-panel="items"]').click();
 await page.locator('[data-v64-box]').click();
 const options=await page.locator('[data-gear-reward]').evaluateAll(es=>es.map(e=>e.dataset.gearReward));assert.equal(new Set(options).size,3);
 await shot('03-reward');await page.locator('#gearRewardHome').click();
 await page.locator('[data-v64-box]').click();
 assert.deepEqual(await page.locator('[data-gear-reward]').evaluateAll(es=>es.map(e=>e.dataset.gearReward)),options);
 await page.locator('[data-gear-reward]').first().click();g=await state();assert(g.bag.includes(options[0]));record('deferred supply choice');
 await shot('04-workshop');
 // The actual pointer gear path is tested, not direct invocation of equip().
 const itemIndex=g.bag.indexOf(options[0]),target=g.player.board.findIndex(u=>u&&u.items.length<2);
 await drag(await center(page.locator('[data-item="'+itemIndex+'"]')),await boardPoint(target));
 g=await state();assert(g.player.board[target].items.includes(options[0]));record('pointer equipment drag');
 if(await page.locator('#panelClose').isVisible())await page.locator('#panelClose').click();
 await page.locator('[data-panel="codex"]').click();
 await page.locator('[data-codex-tab="crew"]').click();
 assert.equal(await page.locator('#codexResults [data-crew-art]').count(),42);
 await shot('05-codex');record('42 crew codex');
 await page.locator('#panelClose').click();
 await page.locator('#fightBtn').click();await phase('battle');
 assert.equal(await page.locator('#shopGrid').isVisible(),false);
 // Measure actual requestAnimationFrame cadence on this CI runner, not client GPU FPS.
 const sampling=page.evaluate(()=>new Promise(resolve=>{let start=performance.now(),last=start,intervals=[];function loop(t){intervals.push(t-last);last=t;if(t-start<2000)requestAnimationFrame(loop);else resolve(intervals)}requestAnimationFrame(loop)}));
 await page.waitForTimeout(600);await shot('06-combat-early');
 frames.push(...await sampling);await shot('07-combat-late');
 await page.waitForFunction(()=>['result','gameover'].includes(window.__riftGame.getState().phase),null,{timeout:45000});
 g=await state();assert(g.combatSummary?.review?.a?.units?.length);assert(g.combatSummary?.review?.b?.units?.length);
 await shot('08-report');record('real-time battle and both-side report',{round:g.round,win:g.combatSummary.win});
 const review=g.combatSummary.review;
 for(const k of ['alive','damage','healing','tanked']){
  const m=page.locator('[data-review-metric="'+k+'"]');
  for(const [cls,side] of [['ally',review.a],['enemy',review.b]])assert.equal(await m.locator('b.'+cls).textContent(),Number.isFinite(side[k])?Math.round(side[k]).toLocaleString('zh-CN'):'—');
 }
 assert.equal(await page.locator('.v66-side.ally .v66-row').count(),review.a.units.length);
 assert.equal(await page.locator('.v66-side.enemy .v66-row').count(),review.b.units.length);
 assert.equal(await page.locator('.v7-analysis').getAttribute('open'),null);
 const visibleRows=await page.locator('.v66-side .v66-row:first-of-type').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),body=e.closest('.v51-result-body').getBoundingClientRect();return r.top<body.bottom&&r.bottom>body.top}));
 assert.deepEqual(visibleRows,[true,true],'both first crew rows visible without scrolling');
 await page.locator('[data-v66-sort="tanked"]').click();
 assert.equal(await page.locator('[data-v66-sort="tanked"]').getAttribute('aria-pressed'),'true');
 for(const [cls,side] of [['ally',review.a],['enemy',review.b]]){
  const expected=[...side.units].sort((a,b)=>(Number.isFinite(b.tanked)?b.tanked:-1)-(Number.isFinite(a.tanked)?a.tanked:-1)).map(u=>Number.isFinite(u.tanked)?Math.round(u.tanked).toLocaleString('zh-CN'):'—');
  assert.deepEqual(await page.locator('.v66-side.'+cls+' .v66-value').allTextContents(),expected);
 }
 await shot('08a-report-sort');
 await page.locator('.v7-analysis > summary').click();
 assert.notEqual(await page.locator('.v7-analysis').getAttribute('open'),null);
 assert(await page.locator('.v7-analysis .v60-compare').isVisible());
 await shot('08b-report-analysis');
 record('compact report values, visible rows, sorting and expanded analysis');
 if(g.phase==='result'){await page.locator('#nextRoundBtn').click();await phase('prep');const before=await state();await page.reload({waitUntil:'load'});await page.locator('#continueBtn').click();await phase('prep');const after=await state();assert.equal(after.round,before.round);assert.equal(after.player.gold,before.player.gold);record('save and reload');await shot('09-resumed')}
 // Smaller-screen first impression; no claim of complete mobile operability.
 const small=await browser.newPage({viewport:{width:820,height:1180},deviceScaleFactor:1});
 small.on('pageerror',e=>errors.push(e.message));await small.goto(url,{waitUntil:'load'});await small.screenshot({path:out+'/10-tablet-menu.png',fullPage:true});await small.close();
 assert.deepEqual(errors,[]);record('no browser exceptions or console errors');
}catch(e){await shot('99-failure').catch(()=>{});errors.push(e.stack||String(e));process.exitCode=1}
finally{
 const sorted=frames.filter(n=>n>0).sort((a,b)=>a-b);
 const perf=sorted.length?{samples:sorted.length,meanMs:sorted.reduce((a,b)=>a+b,0)/sorted.length,p95Ms:sorted[Math.floor((sorted.length-1)*.95)],note:'rAF cadence on headless CI, not game paint FPS or player hardware'}:null;
 await writeFile(out+'/report.json',JSON.stringify({checks,errors,perf},null,2));console.log(JSON.stringify({checks,errors,perf},null,2));await browser.close()
}
