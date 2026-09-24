// reg0000: ghost(Pro) 填表注册
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
await sleep(800);

for (const [id, val] of [['signup-name', 'Leo Xm'], ['signup-email', 'ghost@92ng.com'], ['signup-password', 'Xx@Ghost26!Xm']]) {
  await send('Runtime.evaluate', { expression: `document.getElementById('${id}').focus()` });
  await sleep(250);
  await send('Input.insertText', { text: val });
  await sleep(250);
}
const check = await (await send('Runtime.evaluate', { expression: `JSON.stringify({n:document.getElementById('signup-name').value,e:document.getElementById('signup-email').value,p:document.getElementById('signup-password').value.length})`, returnByValue: true })).result?.value;
console.log('CHECK:', check);
await send('Runtime.evaluate', { expression: `document.getElementById('submit-email').scrollIntoView({block:'center'})` });
await sleep(400);
await send('Runtime.evaluate', { expression: `document.getElementById('submit-email').click()` });
console.log('clicked Continue');

for (let i = 0; i < 8; i++) {
  await sleep(3000);
  const st = await (await send('Runtime.evaluate', { expression: `JSON.stringify({url:location.href.slice(0,80),body:document.body.innerText.slice(0,250)})`, returnByValue: true })).result?.value;
  console.log('poll' + i + ':', st);
  if (!st.includes('Continue')) break;
}
const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(OUT + '_reg0000_gh_2.png', Buffer.from(shot.data, 'base64'));
ws.close();
console.log('DONE');
