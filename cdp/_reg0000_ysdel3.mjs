import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// youslade: open post dropdown (chevron), delete post, confirm
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('youslade.com'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
await clickXY(1129, 199);
await sleep(1800);
const del = await c.evalT(`(function(){ const items=[...document.querySelectorAll('a,li,button,span,div')].filter(x=>x.offsetParent&&/^delete/i.test((x.innerText||'').trim())); if(!items.length) return 'NO_DEL'; const x=items[0]; const r=x.getBoundingClientRect(); return JSON.stringify({txt:(x.innerText||'').trim().slice(0,25),x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`, 10000);
console.log('delete item:', del);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/ys_delmenu.png', Buffer.from(shot.data,'base64'));
if(del.startsWith('{')){
  const p=JSON.parse(del);
  await clickXY(p.x, p.y);
  await sleep(2500);
  const shot2 = await c.send('Page.captureScreenshot', {format:'png'});
  writeFileSync('D:/Github/seoadminC/storage/_reg0000/ys_confirm.png', Buffer.from(shot2.data,'base64'));
}
process.exit(0);
