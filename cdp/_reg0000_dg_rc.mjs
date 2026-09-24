// reg0000: diigo reCAPTCHA v2 checkbox 点击
import fs from 'fs';
const OUT = 'D:/Github/backlink_skills/storage/tmp/';
const TAB = process.argv[2], X = parseFloat(process.argv[3]), Y = parseFloat(process.argv[4]);
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
await sleep(800);

for (let i = 0; i <= 5; i++) {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(200 + (X - 200) * i / 5), y: Math.round(500 + (Y - 500) * i / 5) });
  await sleep(100);
}
await sleep(500);
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: X, y: Y, button: 'left', clickCount: 1 });
await sleep(80);
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: X, y: Y, button: 'left', clickCount: 1 });
console.log('clicked rc checkbox', X, Y);

await sleep(5000);
const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(OUT + '_reg0000_dg_5.png', Buffer.from(shot.data, 'base64'));
ws.close();
console.log('DONE');
