// reg0000: ampblogs KEYCaptcha 拖拽——12步插值拖块入洞→绿勾→点SIGN IN
import fs from 'fs';
const OUT = 'D:/Github/backlink_skills/storage/tmp/';
const TAB = process.argv[2];
const FX = parseFloat(process.argv[3]), FY = parseFloat(process.argv[4]);   // 拖块中心
const TX = parseFloat(process.argv[5]), TY = parseFloat(process.argv[6]);   // 洞中心
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
await sleep(400);

// mousePressed 按住拖块
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: FX, y: FY });
await sleep(150);
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: FX, y: FY, button: 'left', clickCount: 1 });
await sleep(200);
// 12步平滑移动
for (let i = 1; i <= 12; i++) {
  const x = Math.round(FX + (TX - FX) * i / 12);
  const y = Math.round(FY + (TY - FY) * i / 12);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(90);
}
await sleep(250);
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: TX, y: TY, button: 'left', clickCount: 1 });
console.log('dragged', FX, FY, '->', TX, TY);
await sleep(2500);

// 检查绿勾
const chk = await (await send('Runtime.evaluate', { expression: `(() => { const v = document.querySelector('#validPuzzle, div[id*=valid]'); return JSON.stringify({validVisible: v ? getComputedStyle(v).display !== 'none' : false}); })()`, returnByValue: true })).result?.value;
console.log('CHK:', chk);
const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(OUT + '_reg0000_amp_pz3.png', Buffer.from(shot.data, 'base64'));
ws.close();
console.log('DONE');
