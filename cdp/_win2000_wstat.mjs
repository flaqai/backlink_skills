// _win2000_wstat.mjs: 连到 post.php?post=N 编辑 tab 读发布状态+截图 <postid> [postnew]
import { sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const pid = process.argv[2];
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.filter(t => t.type === 'page').reverse().find(t => t.url.includes('post.php?post=' + pid) || (process.argv[3] && t.url.includes('post-new.php')));
if (!tab) { console.log('NO TAB post=' + pid); process.exit(1); }
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
const st = await evalExpr(`JSON.stringify({
  url: location.href.slice(0,90),
  btns: [...document.querySelectorAll('button')].filter(b => b.getBoundingClientRect().width>0 && /publish|update|save draft|switch to draft/i.test(b.innerText)).map(b=>b.innerText.trim()).slice(0,5),
  statusText: (document.querySelector('.post-status, .components-panel__row')?.innerText || '').replace(/\s+/g,' ').slice(0,120),
  viewLink: [...document.querySelectorAll('a')].map(a=>a.href).find(h => /leoxmseo2\.wordpress\.com\/(?!wp-admin)/.test(h) && !h.includes('wp-admin') && !h.includes('wp-login'))
})`);
console.log(st);
const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 60 });
writeFileSync('D:/Github/backlink_skills/cdp/_win2000_w204stat.jpg', Buffer.from(s.data, 'base64'));
console.log('shot saved');
process.exit(0);
