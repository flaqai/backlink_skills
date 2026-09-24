import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// youslade: fill textarea.postText and Publish
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('youslade.com'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
const TXT = `Finally set up my little corner here. Planning to use this space as a running notebook: short notes on the small software choices that quietly shape a workday, and the occasional observation when a tool either earns its keep or gets uninstalled. No grand conclusions, just honest field notes as I go.`;
const r = await c.evalT(`(function(){ const ta=document.querySelector('textarea.postText'); if(!ta) return null; ta.scrollIntoView({block:'center'}); ta.focus(); const b=ta.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}); })()`, 8000);
if(!r){ console.log('NO TEXTAREA'); process.exit(1); }
const p=JSON.parse(r); await clickXY(p.x, p.y); await sleep(300);
await c.send('Input.insertText', {text: TXT});
await sleep(500);
const btn = await c.evalT(`(function(){ const b=[...document.querySelectorAll('button')].find(x=>(x.innerText||'').trim()==='Publish'&&x.offsetParent); if(!b) return null; const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`, 8000);
console.log('publish:', btn);
if(!btn) process.exit(1);
const pp=JSON.parse(btn); await clickXY(pp.x, pp.y);
await sleep(7000);
const st = await c.evalT(`(function(){ const body=(document.body.innerText||''); return JSON.stringify({url:location.href.slice(0,90), hasMyText: body.includes('running notebook'), err: body.slice(0,120)}); })()`, 10000);
console.log(st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/ys_posted.png', Buffer.from(shot.data,'base64'));
process.exit(0);
