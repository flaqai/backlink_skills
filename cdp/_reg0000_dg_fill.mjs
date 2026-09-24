// reg0000: diigo 填表+提交注册
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

const USER = 'leoxm26', EMAIL = 'diigo@92ng.com', PASS = 'Xx@Diigo26!Xm';

// 逐字段 focus + insertText 真打字
for (const [id, val] of [['username', USER], ['email', EMAIL], ['password', PASS]]) {
  await send('Runtime.evaluate', { expression: `document.getElementById('${id}').focus()` });
  await sleep(300);
  await send('Input.insertText', { text: val });
  await sleep(300);
}
// 确认值
const check = await (await send('Runtime.evaluate', { expression: `JSON.stringify({u:document.getElementById('username').value.length,e:document.getElementById('email').value,p:document.getElementById('password').value.length})`, returnByValue: true })).result?.value;
console.log('CHECK:', check);

const shot1 = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(OUT + '_reg0000_dg_3.png', Buffer.from(shot1.data, 'base64'));

// 点 createAccount
await send('Runtime.evaluate', { expression: `document.getElementById('createAccount').scrollIntoView({block:'center'})` });
await sleep(500);
await send('Runtime.evaluate', { expression: `document.getElementById('createAccount').click()` });
console.log('clicked createAccount');

for (let i = 0; i < 6; i++) {
  await sleep(3000);
  const st = await (await send('Runtime.evaluate', { expression: `JSON.stringify({url:location.href.slice(0,70),body:document.body.innerText.slice(0,300)})`, returnByValue: true })).result?.value;
  console.log('poll' + i + ':', st);
}
const shot2 = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(OUT + '_reg0000_dg_4.png', Buffer.from(shot2.data, 'base64'));
ws.close();
console.log('DONE');
