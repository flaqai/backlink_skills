import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// youslade: hover post chevron to open menu (WoWonder dropdowns often need hover), then Delete
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('youslade.com'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
// locate first post chevron fresh
const pos = await c.evalT(`(function(){ window.scrollTo(0, 620); const svg=[...document.querySelectorAll('[data-post-id] .dropdown-toggle, [data-post-id] svg, [data-post-id] [class*=dropdown]')].filter(x=>x.getBoundingClientRect().y>100); const x=svg[0]; if(!x) return 'NONE'; x.scrollIntoView({block:'center'}); const r=x.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`, 10000);
console.log('chevron:', pos);
if(!pos.startsWith('{')) process.exit(1);
const p = JSON.parse(pos);
// hover then click (bootstrap dropdown needs click; hover-then-click for safety)
await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x,y:p.y});
await sleep(700);
await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x+2,y:p.y+2});
await sleep(400);
await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x:p.x+2,y:p.y+2,button:'left',clickCount:1});
await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x+2,y:p.y+2,button:'left',clickCount:1});
await sleep(1500);
const del = await c.evalT(`(function(){ const items=[...document.querySelectorAll('a,li,button,span,div')].filter(x=>x.offsetParent&&/^delete/i.test((x.innerText||'').trim())); if(!items.length) return 'NO_DEL'; const x=items[0]; const r=x.getBoundingClientRect(); return JSON.stringify({txt:(x.innerText||'').trim().slice(0,25),x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`, 10000);
console.log('delete:', del);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/ys_del7.png', Buffer.from(shot.data,'base64'));
if(del.startsWith('{')){
  const dp=JSON.parse(del);
  await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:dp.x,y:dp.y});
  await sleep(200);
  await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x:dp.x,y:dp.y,button:'left',clickCount:1});
  await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:dp.x,y:dp.y,button:'left',clickCount:1});
  await sleep(2500);
  const shot2 = await c.send('Page.captureScreenshot', {format:'png'});
  writeFileSync('D:/Github/seoadminC/storage/_reg0000/ys_del8.png', Buffer.from(shot2.data,'base64'));
  console.log('clicked delete');
}
process.exit(0);
