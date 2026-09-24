// reg0000 0909: creatorlink 第五步——进站点编辑器(SPA)探菜单管理
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const log = (s) => fs.writeSync(1, s + '\n');

const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && t.url.includes('creatorlink'));
const before = new Set(list.filter(t => t.type === 'page').map(t => t.id));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(() => rej(new Error('ws超时')), 8000); });
const c = new CDP(ws);
await c.send('Page.enable');
await c.send('Runtime.enable');
c.on(async (m) => {
  if (m.method === 'Runtime.consoleAPICalled') { /* 静音 */ }
});

// 找「사이트 편집」按钮
const btn = JSON.parse(await c.evalT(`(() => {
  const els = [...document.querySelectorAll('a,button')].filter(e => /사이트 편집|사이트편집/.test(e.innerText || ''));
  if (!els.length) return JSON.stringify({ none: true });
  const e = els[0];
  e.scrollIntoView({ block: 'center' });
  const r = e.getBoundingClientRect();
  return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), href: e.href || '', target: e.target || '' });
})()`, 8000));
log('BTN: ' + JSON.stringify(btn));
if (btn.none) { log('NO EDIT BTN'); throw new Error('no btn'); }

await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: btn.x, y: btn.y });
await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: btn.x, y: btn.y, button: 'left', clickCount: 1 });
await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: btn.x, y: btn.y, button: 'left', clickCount: 1 });
log('CLICKED edit');
await sleep(8000);

// 当前tab新URL + 是否开新tab
const newlist = await (await fetch('http://127.0.0.1:9224/json/list')).json();
for (const t of newlist.filter(t => t.type === 'page')) {
  const mark = before.has(t.id) ? '(old)' : '(NEW)';
  log('TAB ' + mark + ' ' + t.id.slice(0, 8) + ' ' + t.url.slice(0, 120));
}
const cur = await c.evalT('location.href', 6000);
log('CUR: ' + cur);
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('D:/Github/seoadminC/storage/_reg0000_cl_editor.png', Buffer.from(shot.data, 'base64'));
log('SHOT saved');
log('DONE');
