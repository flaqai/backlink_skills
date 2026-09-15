import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('postach.io/register'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
// 从 (585,510) 拖到 (510,390)
const sx = 585, sy = 510, tx = 510, ty = 390;
await ev('mouseMoved', { x: sx, y: sy });
await sleep(300);
await ev('mousePressed', { x: sx, y: sy, button: 'left', clickCount: 1 });
await sleep(500);
// 分步移动带轻微抖动
const steps = 14;
for (let i = 1; i <= steps; i++) {
  const jx = (Math.random() - 0.5) * 3, jy = (Math.random() - 0.5) * 3;
  await ev('mouseMoved', { x: Math.round(sx + (tx - sx) * i / steps + jx), y: Math.round(sy + (ty - sy) * i / steps + jy) });
  await sleep(40 + Math.round(Math.random() * 60));
}
await sleep(400);
await ev('mouseReleased', { x: tx, y: ty, button: 'left', clickCount: 1 });
await sleep(5000);
console.log('TEXT:', await c.evalT("document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,8).join(' | ')", 6000));
console.log('IFRAMES:', await c.evalT(`JSON.stringify([...document.querySelectorAll('iframe')].map(function(f){var b=f.getBoundingClientRect(); return f.src.slice(0,45)+' @'+Math.round(b.x)+','+Math.round(b.y)+' '+Math.round(b.width)+'x'+Math.round(b.height);}).filter(function(s){return s.indexOf('0x0')<0;}))`, 6000));
const shot = await c.send('Page.captureScreenshot', {format:'png'}).catch(()=>null);
if(shot) writeFileSync('D:/Github/seoadminC/storage/_reg0000/postach_drag1.png', Buffer.from(shot.data,'base64'));
console.log('SHOT ok');
