// reg0000: amoblog 注册——填表提交触发九宫格→截图
import fs from 'fs';
const OUT = 'D:/Github/backlink_skills/storage/tmp/';
const TAB = process.argv[2];
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
await sleep(500);

// value赋值+input事件
await send('Runtime.evaluate', { expression: `(() => {
  const set = (n, v) => { const e = document.querySelector('input[name=' + n + ']'); e.focus(); e.value = v; e.dispatchEvent(new Event('input', {bubbles:true})); };
  set('email', 'amoblog@92ng.com');
  set('password', 'Xx@Amo26!Xm');
  set('username', 'leoxm26');
  return 'ok';
})()`, returnByValue: true }).then(r => console.log('FILL:', r.result?.value));
await sleep(400);

// 点提交
const btn = await (await send('Runtime.evaluate', { expression: `(() => { const b = document.querySelector('input[name=signup]'); b.scrollIntoView({block:'center'}); const r = b.getBoundingClientRect(); return JSON.stringify({x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2)}); })()`, returnByValue: true })).result?.value;
const bc = JSON.parse(btn);
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: bc.x, y: bc.y });
await sleep(120);
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: bc.x, y: bc.y, button: 'left', clickCount: 1 });
await sleep(80);
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: bc.x, y: bc.y, button: 'left', clickCount: 1 });
console.log('submitted');
await sleep(5000);

const st = await (await send('Runtime.evaluate', { expression: `JSON.stringify({url:location.href.slice(0,60),captchaWin:!!document.querySelector('#captcha_window,.captcha_window,#imgs-window'),body:document.body.innerText.slice(0,200)})`, returnByValue: true })).result?.value;
console.log('ST:', st);
const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(OUT + '_reg0000_amo_1.png', Buffer.from(shot.data, 'base64'));
ws.close();
console.log('DONE');
