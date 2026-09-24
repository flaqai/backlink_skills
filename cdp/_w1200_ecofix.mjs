import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
// win1200: ecoblue 摘广告浮层 + 露出完整挑战
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.find(t => (t.url || '').includes('directory9') && t.type === 'page');
if (!tab) { console.log('NO_TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
const r = await cdp.eval(`(() => {
  let removed = [];
  // 1) 摘底部一切大块元素(含iframe/插播), 关Close插播
  for (const el of document.querySelectorAll('div,iframe,ins,section,a,img')) {
    const rc = el.getBoundingClientRect();
    if (rc.height > 60 && rc.top > window.innerHeight * 0.72) {
      removed.push((el.tagName || '?') + ':' + (el.className || el.id || '').toString().slice(0, 30) + ':y' + Math.round(rc.top));
      el.style.display = 'none';
    }
  }
  const closeBtn = [...document.querySelectorAll('a,div,span,button')].find(e => /^close$/i.test((e.innerText || '').trim()) && e.getBoundingClientRect().width < 120);
  if (closeBtn) { closeBtn.click(); removed.push('CLOSE_CLICKED'); }
  return JSON.stringify({ removed: removed.slice(0, 10) });
})()`);
console.log(r);
await sleep(500);
const st = await cdp.eval(`(() => {
  const f = [...document.querySelectorAll('iframe[src*="recaptcha"]')].map(x => ({ f: x, r: x.getBoundingClientRect() })).sort((a, b) => b.r.width - a.r.width)[0];
  if (!f) return JSON.stringify({ bframe: null });
  f.f.scrollIntoView({ block: 'center' });
  const q = f.f.getBoundingClientRect();
  return JSON.stringify({ bframe: { x: q.x, y: q.y, w: q.width, h: q.height } });
})()`);
console.log(st);
await sleep(800);
const shot = await cdp.send('Page.captureScreenshot', {});
fs.writeFileSync('_w1200_ecoblue2.png', Buffer.from(shot.data, 'base64'));
console.log('SHOT2');
ws.close();
