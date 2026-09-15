// reg0000: diigo reCAPTCHA 判图点击——参数: tabId + 逗号分隔坐标列表
// 用法: node _reg0000_rc_click.mjs <tabId> 562,358 657,358 ...
import fs from 'fs';
const OUT = 'D:/Github/backlink_skills/storage/tmp/';
const TAB = process.argv[2];
const pts = process.argv.slice(3).map(s => s.split(',').map(Number));
const sleep = ms => new Promise(r => setTimeout(r, ms));

const list = await fetch('http://127.0.0.1:9224/json').then(r => r.json());
const t = list.find(x => x.id === TAB);
const ws = new WebSocket(t.webSocketDebuggerUrl);
let mid = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res) => { const id = ++mid; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
await new Promise(r => ws.onopen = r);
await send('Page.enable'); await send('Runtime.enable');
await send('Target.activateTarget', { targetId: TAB });
await sleep(600);

for (const [x, y] of pts) {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(150);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await sleep(80);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  console.log('clicked', x, y);
  await sleep(700);
}
if (process.argv[2 + 0] === undefined) { /* noop */ }
const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(OUT + '_reg0000_rc_after.png', Buffer.from(shot.data, 'base64'));
ws.close();
console.log('DONE pts=' + pts.length);
