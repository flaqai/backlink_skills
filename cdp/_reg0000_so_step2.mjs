// reg0000: sooperarticles step2——真实点击CF checkbox过盾+等跳转
import fs from 'fs';
const OUT = 'D:/Github/backlink_skills/storage/tmp/';
const TAB = process.argv[2];
const X = parseFloat(process.argv[3] || '255'), Y = parseFloat(process.argv[4] || '312');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const list = await fetch('http://127.0.0.1:9224/json').then(r => r.json());
const t = list.find(x => x.id === TAB);
if (!t) { console.log('TAB_NOT_FOUND'); process.exit(1); }
const ws = new WebSocket(t.webSocketDebuggerUrl);
let mid = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res) => { const id = ++mid; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
await new Promise(r => ws.onopen = r);
await send('Page.enable'); await send('Runtime.enable');
await send('Target.activateTarget', { targetId: TAB });
await sleep(1500);

await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: X, y: Y });
await sleep(400);
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: X, y: Y, button: 'left', clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: X, y: Y, button: 'left', clickCount: 1 });
console.log('clicked', X, Y);

for (let i = 0; i < 8; i++) {
  await sleep(3000);
  const info = await (await send('Runtime.evaluate', { expression: `(() => ({ url: location.href, title: document.title, bodyLen: document.body.innerText.length }))()`, returnByValue: true })).result?.value;
  console.log('poll' + i + ':', JSON.stringify(info));
  if (info.url.includes('/signup') && !info.title.includes('请稍候') && !info.title.includes('Just a moment')) break;
}
const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(OUT + '_reg0000_so_2.png', Buffer.from(shot.data, 'base64'));
ws.close();
console.log('DONE');
