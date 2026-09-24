// _win2000_wpub3.mjs: 参数化两段式真实坐标发布 <postid> — 定位Publish钮→真实鼠标点击→面板确认→核验
import { sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const pid = process.argv[2];
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.filter(t => t.type === 'page').reverse().find(t => t.url.includes('post.php?post=' + pid));
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
const realClick = async (x, y) => {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(200);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await sleep(80);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};
const shot = async (name) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 60 });
  writeFileSync('D:/Github/backlink_skills/cdp/' + name, Buffer.from(s.data, 'base64')); };
// 主钮坐标 (右上 Publish)
let coords = await evalExpr(`(() => {
  const b = [...document.querySelectorAll('button')].filter(b => b.getBoundingClientRect().width > 0).find(b => /^publish$/i.test(b.innerText.trim()));
  if (!b) return 'nf';
  b.scrollIntoView({block:'center'});
  const r = b.getBoundingClientRect();
  return JSON.stringify([Math.round(r.x + r.width/2), Math.round(r.y + r.height/2)]);
})()`);
console.log('主钮:', coords);
if (coords.startsWith('[')) { const [x, y] = JSON.parse(coords); await realClick(x, y); }
await sleep(4000);
// 面板确认钮
let p2 = await evalExpr(`(() => {
  const vis = [...document.querySelectorAll('button')].filter(b => b.getBoundingClientRect().width > 0 && /publish/i.test(b.innerText));
  return JSON.stringify(vis.map(b => { const r = b.getBoundingClientRect(); return { x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2), t: b.innerText.trim().slice(0,25) }; }));
})()`);
console.log('面板候选:', p2);
let list;
try { list = JSON.parse(p2); } catch { list = []; }
// 点最像确认的那个 (非编辑器右上主钮: 面板里 y 更靠中下 或文案非纯 publish)
const cand = list.filter(b => !/^publish$/i.test(b.t)) [0] || list[list.length-1];
if (cand) { console.log('点确认:', cand.t, cand.x, cand.y); await realClick(cand.x, cand.y); }
await sleep(9000);
const fin = await evalExpr(`JSON.stringify({ url: location.href.slice(0,90), btns: [...document.querySelectorAll('button')].filter(b => b.getBoundingClientRect().width>0 && /update|publish|switch to draft/i.test(b.innerText)).map(b=>b.innerText.trim()).slice(0,4) })`);
console.log('终态:', fin);
await shot('_win2000_w204pub_fin.jpg');
console.log('shot saved');
process.exit(0);
