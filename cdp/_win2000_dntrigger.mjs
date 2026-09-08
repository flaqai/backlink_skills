import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const page = list.find(t => t.type === 'page' && /directorynode\.com/.test(t.url));
await fetch(`http://127.0.0.1:9224/json/activate/${page.id}`).catch(()=>{});
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const click = async (x, y) => {
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};
// 1) 滚 anchor 进视口
const ap = await c.evalT(`(() => { const a = [...document.querySelectorAll('iframe')].find(f => /anchor/.test(f.src)); if (!a) return 'NO'; a.scrollIntoView({block:'center'}); const r = a.getBoundingClientRect(); return JSON.stringify({ x: r.x, y: r.y, w: r.width, h: r.height }); })()`, 6000);
console.log('anchor:', ap);
if (ap === 'NO') process.exit(1);
const a = JSON.parse(ap);
await sleep(1000);
// 2) 点复选框(anchor 左侧偏中)
await click(a.x + 30, a.y + a.h / 2);
await sleep(4000);
// 3) 挑战位置+bframe可见性
const st = await c.evalT(`(() => { const b = document.querySelector('iframe[src*="bframe"]'); return JSON.stringify({ bf: b ? b.getBoundingClientRect().toJSON() : null, scrollY: scrollY }); })()`, 6000);
console.log('挑战后:', st);
// 4) 若 bframe 仍在视口外, 滚动到它(它的父层fixed?)
const bfv = JSON.parse(st);
if (bfv.bf && (bfv.bf.y < 0 || bfv.bf.y > 805)) {
  console.log('bframe出视口, 滚动anchor区域对准');
  await c.evalT(`(() => { const a = [...document.querySelectorAll('iframe')].find(f => /anchor/.test(f.src)); a.scrollIntoView({block:'center'}); return scrollY; })()`, 5000);
  await sleep(1500);
  console.log('再查:', await c.evalT(`(() => { const b = document.querySelector('iframe[src*="bframe"]'); return JSON.stringify(b ? b.getBoundingClientRect().toJSON() : null); })()`, 5000));
}
const shot = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
fs.writeFileSync('D:/Github/backlink_skills/cdp/_win2000_dn_page2.jpg', Buffer.from(shot.data, 'base64'));
console.log('page2 shot saved');
