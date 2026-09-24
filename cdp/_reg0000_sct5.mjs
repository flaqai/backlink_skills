import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// scoop.it: dismiss pro popup then create topic (chained)
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('scoop.it'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
// 1. click Create a Topic
let b = JSON.parse(await c.evalT(`(function(){ const x=[...document.querySelectorAll('button')].find(y=>(y.innerText||'').includes('Create a Topic')&&y.offsetParent); if(!x) return null; x.scrollIntoView({block:'center'}); const r=x.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`, 8000));
await clickXY(b.x, b.y);
await sleep(2500);
// 2. No, thanks on popup
const nt = await c.evalT(`(function(){ const x=[...document.querySelectorAll('button,a')].find(y=>/no,.?thanks/i.test((y.innerText||'').trim())&&y.offsetParent); if(!x) return 'NO_POPUP'; const r=x.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`, 8000);
console.log('no-thanks:', nt);
if(nt.startsWith('{')){ const p=JSON.parse(nt); await clickXY(p.x,p.y); await sleep(2000); }
// 3. click Create a Topic again
b = JSON.parse(await c.evalT(`(function(){ const x=[...document.querySelectorAll('button')].find(y=>(y.innerText||'').includes('Create a Topic')&&y.offsetParent); if(!x) return null; x.scrollIntoView({block:'center'}); const r=x.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`, 8000));
console.log('create btn again:', b);
if(b){ await clickXY(b.x, b.y); }
await sleep(8000);
const st = await c.evalT(`(function(){ return JSON.stringify({url:location.href.slice(0,120), title:document.title.slice(0,60)}); })()`, 10000);
console.log(st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/sc_topic3.png', Buffer.from(shot.data,'base64'));
process.exit(0);
