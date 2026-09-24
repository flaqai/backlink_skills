// reg0000: ampblogs 浏览器全流程——/login填表→点Sign in触发拼图→截图
import fs from 'fs';
const OUT = 'D:/Github/backlink_skills/storage/tmp/';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const CDP = await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent('https://ampblogs.com/login'), { method: 'PUT' }).then(r => r.json());
console.log('TAB=' + CDP.id);
const ws = new WebSocket(CDP.webSocketDebuggerUrl);
let mid = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res) => { const id = ++mid; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
await new Promise(r => ws.onopen = r);
await send('Page.enable'); await send('Runtime.enable');
await send('Target.activateTarget', { targetId: CDP.id });
await sleep(6000);

// 填表
for (const [name, val] of [['username', 'leoxmamp'], ['password', 'Xx@AmpBlogs26!Xm']]) {
  await send('Runtime.evaluate', { expression: `const i=document.querySelector('input[name=${name}]'); i.scrollIntoView({block:'center'}); i.focus();` });
  await sleep(250);
  await send('Input.insertText', { text: val });
  await sleep(250);
}
const check = await (await send('Runtime.evaluate', { expression: `JSON.stringify({u:document.querySelector('input[name=username]').value,p:document.querySelector('input[name=password]').value.length})`, returnByValue: true })).result?.value;
console.log('FILL:', check);

// 点 Sign in 触发拼图
const btn = await (await send('Runtime.evaluate', { expression: `(() => { const b=document.querySelector('button[name=login]'); b.scrollIntoView({block:'center'}); const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`, returnByValue: true })).result?.value;
const bc = JSON.parse(btn);
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: bc.x, y: bc.y });
await sleep(120);
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: bc.x, y: bc.y, button: 'left', clickCount: 1 });
await sleep(80);
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: bc.x, y: bc.y, button: 'left', clickCount: 1 });
console.log('clicked sign-in');
await sleep(4000);

const st = await (await send('Runtime.evaluate', { expression: `JSON.stringify({puzzle:!!document.querySelector('#puzzle,iframe[src*=keycaptcha],canvas'),body:document.body.innerText.slice(0,180)})`, returnByValue: true })).result?.value;
console.log('PUZZLE-ST:', st);
const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(OUT + '_reg0000_amp_pz.png', Buffer.from(shot.data, 'base64'));
ws.close();
console.log('TAB_KEEP=' + CDP.id);
