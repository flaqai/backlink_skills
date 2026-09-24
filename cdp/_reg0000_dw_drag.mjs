import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

// reg0000c3: hCaptcha 拖拽 (橙色五瓣花 -> 中下灰白五瓣花)
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())]
  .find(t => t.type === 'page' && /dreamwidth\.org\/create/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`).catch(() => {});
await sleep(400);

// 拖块 (288,435) -> 目标 (492,628) 多步中间移动
await ev('mouseMoved', { x: 288, y: 435 }); await sleep(200);
await ev('mousePressed', { x: 288, y: 435, button: 'left', clickCount: 1 }); await sleep(250);
// 平滑移动 12 步
const steps = 12;
for (let i = 1; i <= steps; i++) {
  const x = Math.round(288 + (492 - 288) * i / steps);
  const y = Math.round(435 + (628 - 435) * i / steps);
  await ev('mouseMoved', { x, y, buttons: 1 }); await sleep(60 + i * 12);
}
await sleep(300);
await ev('mouseReleased', { x: 492, y: 628, button: 'left', clickCount: 1, buttons: 1 });
await sleep(3000);

const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/dw_drag1.png', Buffer.from(s.data, 'base64'));
console.log('SHOT ok');
process.exit(0);
