import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// youslade: scroll to timeline posts, open first post menu, delete one duplicate
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('youslade.com'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(3000);
// scroll to the posts area
await c.evalT(`(function(){ const el=[...document.querySelectorAll('*')].find(x=>x.innerText==='leoxm26y'&&x.children.length<3&&x.getBoundingClientRect().y>600); if(el) el.scrollIntoView({block:'start'}); return window.scrollY|0; })()`, 8000);
await sleep(1500);
// find post option menu triggers
const menu = await c.evalT(`(function(){ const trigs=[...document.querySelectorAll('[onclick*=PostOptions], [data-toggle=dropdown], .dropdown-toggle')].filter(x=>x.offsetParent); if(!trigs.length) return 'NONE'; trigs[0].click(); const r=trigs[0].getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2), n:trigs.length}); })()`, 10000);
console.log('menu trigger:', menu);
await sleep(1500);
// click Delete in opened menu
const del = await c.evalT(`(function(){ const items=[...document.querySelectorAll('a,li,button,span')].filter(x=>x.offsetParent&&/delete/i.test(x.innerText||'')); if(!items.length) return 'NO_DEL'; const x=items[0]; const r=x.getBoundingClientRect(); return JSON.stringify({txt:(x.innerText||'').trim().slice(0,25),x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`, 10000);
console.log('delete item:', del);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/ys_del2.png', Buffer.from(shot.data,'base64'));
if(del.startsWith('{')){
  const p=JSON.parse(del);
  await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x,y:p.y});
  await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',clickCount:1});
  await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x,y:p.y,button:'left',clickCount:1});
  await sleep(2500);
  const shot2 = await c.send('Page.captureScreenshot', {format:'png'});
  writeFileSync('D:/Github/seoadminC/storage/_reg0000/ys_del3.png', Buffer.from(shot2.data,'base64'));
}
process.exit(0);
