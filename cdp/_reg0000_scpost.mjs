import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// scoop.it: fill insight comment + publish the scoop
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('scoop.it'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
const INSIGHT = `I keep coming back to this definition because it captures something people miss about curation: it is editing, not collecting. Anyone can bookmark a hundred links. The real work is choosing the three that matter, saying why they matter, and dropping the rest without guilt.

When I started keeping a public notebook about software, I thought the hard part would be finding material. It was the opposite. Material finds you the moment you pay attention to a topic. The hard part is the cut. Every week I delete more than I keep, and the notebook is better for it.

Curation also forces honesty. If I recommend something, my name is next to it. That small bit of exposure changes how carefully I read. It slows me down in a good way, the way a good editor slows down a writer.

My simple rule now: share an item only when I can add one sentence of context that a search result would not tell you. That sentence is the value. Everything else is noise. The page you are reading is my attempt to practice that rule in public, one small pick at a time.`;
// click insight box
const bx = await c.evalT(`(function(){ const el=[...document.querySelectorAll('textarea,[contenteditable=true],div[ph],div')].find(x=>(x.getAttribute&&x.getAttribute('placeholder')||'').includes('insight')||(x.innerText||'').trim()==='Share your insight'); if(!el) return null; el.scrollIntoView({block:'center'}); el.focus(); const b=el.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2),tag:el.tagName}); })()`, 10000);
console.log('insight box:', bx);
if(!bx || !bx.startsWith('{')) process.exit(1);
const p = JSON.parse(bx);
await clickXY(p.x, p.y);
await sleep(400);
await c.send('Input.insertText', {text: INSIGHT});
await sleep(600);
// scroll to bottom, find publish button
const pb = await c.evalT(`(function(){ const cands=[...document.querySelectorAll('button,input[type=submit],a')].filter(x=>x.offsetParent&&/publish|scoop it|save/i.test((x.innerText||x.value||'').trim())); if(!cands.length) return null; const x=cands[cands.length-1]; x.scrollIntoView({block:'center'}); const r=x.getBoundingClientRect(); return JSON.stringify({txt:(x.innerText||x.value||'').trim().slice(0,30),x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`, 10000);
console.log('publish btn:', pb);
const shot0 = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/sc_filled.png', Buffer.from(shot0.data,'base64'));
if(!pb){ console.log('NO PUBLISH BTN'); process.exit(1); }
const pp = JSON.parse(pb);
await clickXY(pp.x, pp.y);
await sleep(8000);
const st = await c.evalT(`(function(){ return JSON.stringify({url:location.href.slice(0,120)}); })()`, 8000);
console.log('after:', st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/sc_posted.png', Buffer.from(shot.data,'base64'));
process.exit(0);
