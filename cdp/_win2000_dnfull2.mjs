import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const page = list.find(t => t.type === 'page' && /directorynode\.com/.test(t.url));
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
// anchor 位置(挑战弹窗在anchor旁) + 当前滚动位置
const st = await c.evalT(`(() => {
  const a = [...document.querySelectorAll('iframe')].find(f => /anchor/.test(f.src));
  const b = document.querySelector('iframe[src*="bframe"]');
  return JSON.stringify({
    anchor: a ? a.getBoundingClientRect().toJSON() : null,
    bframe: b ? b.getBoundingClientRect().toJSON() : null,
    scrollY: scrollY,
    innerH: innerHeight
  });
})()`, 6000);
console.log('STATE:', st);
const shot = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 60 });
fs.writeFileSync('D:/Github/backlink_skills/cdp/_win2000_dn_page.jpg', Buffer.from(shot.data, 'base64'));
console.log('page shot saved');
