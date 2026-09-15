import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t2 => t2.type === 'page' && /tblogz\.com\/signup/.test(t2.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
// 找checkbox类元素
const cb = await c.eval(`(function(){ const cands=[...document.querySelectorAll('[class*=captcha],[id*=captcha],[class*=check],[id*=robot]')].filter(e=>e.offsetParent); return JSON.stringify(cands.map(e=>{const b=e.getBoundingClientRect(); return {tag:e.tagName,id:e.id,cls:(e.className||'').toString().slice(0,40),r:[Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)],txt:(e.innerText||'').slice(0,30)};})); })()`);
console.log('CBX:', cb);
const arr = JSON.parse(cb);
if (!arr.length) { console.log('NO_CBX'); process.exit(1); }
const target = arr.find(e => e.r[2] < 60 && e.r[3] < 60) || arr[0];
const cx = target.r[0] + Math.min(20, target.r[2] / 2), cy = target.r[1] + target.r[3] / 2;
await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: cx, y: cy });
await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: cx, y: cy, button: 'left', clickCount: 1 });
await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cx, y: cy, button: 'left', clickCount: 1 });
console.log('CLICKED_CBX', JSON.stringify(target), 'at', Math.round(cx), Math.round(cy));
await sleep(5000);
const st = await c.eval(`JSON.stringify({task:(document.body.innerText.match(/Select all[^.]+/)||[''])[0].slice(0,50), imgs:document.querySelectorAll('#captcha_window img,#imgs-window img').length})`);
console.log('ST:', st);
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/seoadminC/storage/_reg0000_tbz_cbx.png', Buffer.from(shot.data, 'base64'));
process.exit(0);
