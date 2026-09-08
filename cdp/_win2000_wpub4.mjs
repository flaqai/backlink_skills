// _win2000_wpub4.mjs: 点面板最终 Publish <postid> [x,y可选]
import { sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const pid = process.argv[2];
let [fx, fy] = [parseInt(process.argv[3]), parseInt(process.argv[4])];
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.filter(t => t.type === 'page').reverse().find(t => t.url.includes('post.php?post=' + pid));
if (!tab) { console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); setTimeout(() => rej(new Error('ws超时')), 8000); });
let id = 0; const pending = new Map();
ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result || {}); pending.delete(m.id); } });
const send = (method, params = {}) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params })); return new Promise((res) => pending.set(i, res)); };
const evalExpr = async (expr, ms = 10000) => {
  const r = await Promise.race([ send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }),
    new Promise((res) => setTimeout(() => res({ timeout: 1 }), ms)) ]);
  if (r.timeout) return 'TIMEOUT';
  return r.result?.value === undefined ? '' : r.result.value;
};
if (!fx || !fy) {
  // 面板头部蓝钮: aria-ephemeral 区或 .editor-post-publish-button
  const c = await evalExpr(`(() => {
    const b = document.querySelector('.editor-post-publish-button') || [...document.querySelectorAll('button')].filter(x => x.getBoundingClientRect().width>0 && /^publish$/i.test(x.innerText.trim())).pop();
    if (!b) return 'nf';
    const r = b.getBoundingClientRect();
    return JSON.stringify([Math.round(r.x+r.width/2), Math.round(r.y+r.height/2), b.className.slice(0,50)]);
  })()`);
  console.log('定位:', c);
  if (!c.startsWith('[')) { console.log('未找到确认钮'); process.exit(1); }
  [fx, fy] = JSON.parse(c);
}
for (const ty of ['mouseMoved','mousePressed','mouseReleased']) {
  const p = { type: ty, x: fx, y: fy, button: 'left', clickCount: 1 };
  await send('Input.dispatchMouseEvent', p);
}
console.log('clicked', fx, fy);
await sleep(9000);
const fin = await evalExpr(`JSON.stringify({ url: location.href.slice(0,90), btns: [...document.querySelectorAll('button')].filter(b => b.getBoundingClientRect().width>0 && /update|publish|switch to draft/i.test(b.innerText)).map(b=>b.innerText.trim()).slice(0,4), toast: (document.querySelector('.components-snackbar__content')?.innerText||'').slice(0,80) })`);
console.log('终态:', fin);
const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 60 });
writeFileSync('D:/Github/backlink_skills/cdp/_win2000_w204pub2.jpg', Buffer.from(s.data, 'base64'));
process.exit(0);
