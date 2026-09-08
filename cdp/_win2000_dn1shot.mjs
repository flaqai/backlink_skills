// 一条龙: 点checkbox→等挑战→clip截图 (win2000)
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const page = list.find(t => t.type === 'page' && /directorynode\.com/.test(t.url));
await fetch(`http://127.0.0.1:9224/json/activate/${page.id}`).catch(()=>{});
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej('ws'), 6000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const click = async (x, y) => {
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};
// 挑战若已开着先看状态
const st0 = await Promise.race([
  c.evalT(`(() => { const b = document.querySelector('iframe[src*="bframe"]'); if (!b) return 'NO'; const r = b.getBoundingClientRect(); return JSON.stringify({x:r.x,y:r.y,w:r.width,h:r.height}); })()`, 5000),
  new Promise(r => setTimeout(() => r('TIMEOUT'), 6000))
]);
console.log('st0:', st0);
if (st0 === 'TIMEOUT' || st0 === 'NO') {
  // 重触发: 滚anchor点框
  const ap = await Promise.race([
    c.evalT(`(() => { const a = [...document.querySelectorAll('iframe')].find(f => /anchor/.test(f.src)); a.scrollIntoView({block:'center'}); const r = a.getBoundingClientRect(); return JSON.stringify({x:r.x,y:r.y,w:r.width,h:r.height}); })()`, 6000),
    new Promise(r => setTimeout(() => r('TIMEOUT'), 7000))
  ]);
  if (ap === 'TIMEOUT') { console.log('eval hang'); process.exit(1); }
  const a = JSON.parse(ap);
  await sleep(500);
  await click(a.x + 30, a.y + a.h / 2);
  await sleep(4000);
}
const st = await Promise.race([
  c.evalT(`(() => { const b = document.querySelector('iframe[src*="bframe"]'); if (!b) return 'NO'; const r = b.getBoundingClientRect(); return JSON.stringify({x:r.x,y:r.y,w:r.width,h:r.height}); })()`, 5000),
  new Promise(r => setTimeout(() => r('TIMEOUT'), 6000))
]);
console.log('st:', st);
if (st !== 'TIMEOUT' && st !== 'NO') {
  const b = JSON.parse(st);
  if (b.y > 0 && b.y < 800 && b.h > 200) {
    const shot = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: b.x, y: b.y, width: b.w, height: b.h, scale: 2 } });
    fs.writeFileSync('D:/Github/backlink_skills/_win2000_dn_grid.png', Buffer.from(shot.data, 'base64'));
    console.log('GRID SAVED');
  } else console.log('bframe不在视口', JSON.stringify(b));
}
