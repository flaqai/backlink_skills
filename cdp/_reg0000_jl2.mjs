import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// jiliblog: wait editor lazy-load, fill title+content, Publish two-stage
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('jiliblog'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
// wait for #title (editor lazy-load up to 40s)
let ok = false;
for (let i=0;i<8;i++){
  const r = await c.evalT(`(function(){ const t=document.querySelector('#title'); if(!t) return 'NO'; t.scrollIntoView({block:'center'}); t.focus(); const b=t.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}); })()`, 8000);
  if(r && r.startsWith('{')){ const p=JSON.parse(r); await clickXY(p.x,p.y); await sleep(200); await c.send('Input.insertText',{text:'Keeping a Small Notebook in a Noisy Feed'}); ok=true; break; }
  await sleep(5000);
}
console.log('title filled:', ok);
if(!ok) process.exit(1);
await sleep(300);
// Text tab -> #content
const tb = await c.evalT(`(function(){ const b=[...document.querySelectorAll('button, a')].find(x=>(x.innerText||'').trim()==='Text'&&x.offsetParent); if(!b) return null; const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`, 8000);
if(tb){ const bp=JSON.parse(tb); await clickXY(bp.x,bp.y); await sleep(800); }
const paras = [
 'My feed used to be a firehose of announcements. Every app wanted to be the center of my workflow, and every update promised to change everything. Somewhere in that noise I stopped trusting my own memory about which tools actually helped.',
 'So I started a small notebook. Not a second brain, not a system, just a place to write down what I use and why. One line per tool: what it does, what it costs, and whether I reached for it again this week. The rule is simple. If I forget it exists, it goes.',
 'Three things surprised me. First, most of what I keep costs nothing or close to it. Second, the tools that survive are boring on purpose. They do one job and stay out of the way. Third, deleting feels better than installing.',
 'The notebook is not productivity advice. It is closer to hygiene. A quiet list beats a loud feed, and writing one honest line about a tool takes less time than arguing about it in a comment thread.',
];
const html = paras.map(p=>'<p>'+p+'</p>').join('\n');
const cr = await c.evalT(`(function(){ const i=document.querySelector('#content'); if(!i) return null; i.scrollIntoView({block:'center'}); i.focus(); const b=i.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}); })()`, 8000);
if(!cr){ console.log('NO #content'); process.exit(1); }
const cp=JSON.parse(cr); await clickXY(cp.x,cp.y);
await c.send('Input.insertText',{text:html});
await sleep(500);
// Publish two-stage
const pr = await c.evalT(`(function(){ const b=[...document.querySelectorAll('button,input[type=submit],a')].find(x=>(x.innerText||x.value||'').trim().startsWith('Publish')&&x.offsetParent); if(!b) return null; b.scrollIntoView({block:'center'}); const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`, 8000);
console.log('publish1:', pr);
if(!pr) process.exit(1);
const pp=JSON.parse(pr); await clickXY(pp.x,pp.y);
await sleep(4000);
const pr2 = await c.evalT(`(function(){ const cands=[...document.querySelectorAll('button,input[type=submit],a')].filter(x=>x.offsetParent&&(x.innerText||x.value||'').trim()==='Publish'); if(!cands.length) return null; const b=cands[cands.length-1]; b.scrollIntoView({block:'center'}); const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`, 8000);
console.log('publish2:', pr2);
if(pr2){ const p2=JSON.parse(pr2); await clickXY(p2.x,p2.y); }
await sleep(9000);
const fin = await c.evalT(`(function(){ return JSON.stringify({url:location.href.slice(0,110)}); })()`, 8000);
console.log('after publish:', fin);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/jl_posted.png', Buffer.from(shot.data,'base64'));
process.exit(0);
