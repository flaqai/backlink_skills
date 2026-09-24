import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// scoop.it post #2: digital garden insight
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('scoop.it'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(4000);
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
const INSIGHT = `The phrase digital garden finally gave me permission to keep half-finished thoughts in public. A garden is not a feed. Nothing expires, nothing demands a hot take, and the only metric that matters is whether a patch of notes got a little healthier this month than last.

What I like most is the honesty of it. Seeds sit next to evergreens, and the reader can tell which is which. On the modern web that is rare. Most pages pretend to be finished forever, quietly rotting as their facts age. A gardener just labels the bed: this is new, this is half-grown, this I no longer water.

My own notebook runs on the same principle even though it lives in a plain blogging tool. Some entries are one sentence. Some have survived three rewrites. The point was never polish; the point was tending. If you have been waiting for permission to publish imperfect notes, this idea is as good an excuse as any.`;
const bx = await c.evalT(`(function(){ const el=[...document.querySelectorAll('textarea,[contenteditable=true],div')].find(x=>(x.getAttribute&&x.getAttribute('placeholder')||'').includes('insight')||(x.innerText||'').trim()==='Share your insight'); if(!el) return null; el.scrollIntoView({block:'center'}); el.focus(); const b=el.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}); })()`, 10000);
console.log('insight:', bx);
if(!bx || !bx.startsWith('{')) process.exit(1);
const p = JSON.parse(bx);
await clickXY(p.x, p.y);
await sleep(400);
await c.send('Input.insertText', {text: INSIGHT});
await sleep(500);
await c.evalT(`(function(){ window.scrollTo(0, document.body.scrollHeight); return 1; })()`, 6000);
await sleep(1200);
const pb = await c.evalT(`(function(){ const cands=[...document.querySelectorAll('button,input[type=submit],a')].filter(x=>x.offsetParent&&/^publish$/i.test(((x.innerText||x.value||'')).trim())); if(!cands.length) return null; const x=cands[cands.length-1]; x.scrollIntoView({block:'center'}); const r=x.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`, 10000);
console.log('publish:', pb);
if(!pb){ console.log('NO PUBLISH'); process.exit(1); }
const pp = JSON.parse(pb);
await clickXY(pp.x, pp.y);
await sleep(8000);
const st = await c.evalT(`(function(){ const ok=(document.body.innerText||'').includes('successfully published'); return JSON.stringify({ok}); })()`, 8000);
console.log(st);
process.exit(0);
