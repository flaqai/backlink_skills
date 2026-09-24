import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const page = list.find(t => t.type === 'page' && /directorynode\.com/.test(t.url));
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
// 关广告层
console.log('清层:', await Promise.race([
  c.evalT(`(() => {
    let n = 0;
    for (const el of document.querySelectorAll('div')) {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (s.position === 'fixed' && parseInt(s.zIndex) > 50 && r.height > 200 && !el.querySelector('iframe[src*="recaptcha"], iframe[src*="anchor"], iframe[src*="bframe"]')) { el.remove(); n++; }
    }
    const x = [...document.querySelectorAll('button, span, a, div')].find(e => /^(Close|close|×)$/.test((e.textContent||'').trim()) && e.offsetParent !== null);
    if (x) { x.click(); n++; }
    return 'removed:' + n;
  })()`, 6000),
  new Promise(r => setTimeout(() => r('TIMEOUT'), 7000))
]));
await sleep(800);
// 挑战状态
const st = await Promise.race([
  c.evalT(`(() => { const b = document.querySelector('iframe[src*="bframe"]'); if (!b) return 'NO'; const r = b.getBoundingClientRect(); return JSON.stringify({x:r.x,y:r.y,w:r.width,h:r.height}); })()`, 5000),
  new Promise(r => setTimeout(() => r('TIMEOUT'), 6000))
]);
console.log('挑战:', st);
if (st !== 'TIMEOUT' && st !== 'NO') {
  const b = JSON.parse(st);
  if (b.h > 200) {
    const shot = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: b.x, y: Math.max(0, b.y), width: b.w, height: b.h, scale: 2 } });
    fs.writeFileSync('D:/Github/backlink_skills/_win2000_dn_grid.png', Buffer.from(shot.data, 'base64'));
    console.log('GRID SAVED');
  } else console.log('挑战小/关了');
}
