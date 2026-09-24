// reg0000: sooperarticles step3——CF checkbox 二次攻坚（预热移动+精确定位iframe内checkbox）
import fs from 'fs';
const OUT = 'D:/Github/backlink_skills/storage/tmp/';
const TAB = process.argv[2];
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
await send('Emulation.setFocusEmulationEnabled', { enabled: true });
await send('Target.activateTarget', { targetId: TAB });
await sleep(1000);

// 找 turnstile iframe 的视口坐标
const box = await (await send('Runtime.evaluate', { expression: `(() => {
  const f = document.querySelector('iframe[src*="challenges"], iframe[title*="Widget"], iframe[title*="人"], iframe[title*="human"]');
  if (!f) {
    const all = [...document.querySelectorAll('iframe')].map(f => ({src:(f.src||'').slice(0,60), x: Math.round(f.getBoundingClientRect().x), y: Math.round(f.getBoundingClientRect().y), w: Math.round(f.getBoundingClientRect().width), h: Math.round(f.getBoundingClientRect().height)}));
    return JSON.stringify({ none: true, all });
  }
  const r = f.getBoundingClientRect();
  return JSON.stringify({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), src: (f.src||'').slice(0,80) });
})()`, returnByValue: true })).result?.value;
console.log('BOX:', box);
const b = JSON.parse(box);
if (b.none) { console.log('NO_IFRAME'); ws.close(); process.exit(1); }
// checkbox 在 widget 内左侧偏移 ~30,30
const X = b.x + 30, Y = b.y + 30;
console.log('CLICK_AT', X, Y);

// 预热: 几步移动到目标
for (let i = 0; i <= 6; i++) {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(100 + (X - 100) * i / 6), y: Math.round(400 + (Y - 400) * i / 6) });
  await sleep(120);
}
await sleep(600);
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: X, y: Y, button: 'left', clickCount: 1 });
await sleep(90);
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: X, y: Y, button: 'left', clickCount: 1 });
console.log('clicked');

for (let i = 0; i < 10; i++) {
  await sleep(3000);
  const info = await (await send('Runtime.evaluate', { expression: `(() => ({ url: location.href.slice(0,60), title: document.title.slice(0,30), bodyLen: document.body.innerText.length, inputs: document.querySelectorAll('input').length }))()`, returnByValue: true })).result?.value;
  console.log('poll' + i + ':', JSON.stringify(info));
  if (info.inputs > 3) break;
}
const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(OUT + '_reg0000_so_3.png', Buffer.from(shot.data, 'base64'));
ws.close();
console.log('DONE');
