// reg0000: diigo 注册侦察——开/sign-up+等渲染+dump表单+截图
import fs from 'fs';
const OUT = 'D:/Github/backlink_skills/storage/tmp/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const URL = 'https://www.diigo.com/sign-up';

const CDP = await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent(URL), { method: 'PUT' }).then(r => r.json());
console.log('TAB=' + CDP.id);
const ws = new WebSocket(CDP.webSocketDebuggerUrl);
let mid = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res) => { const id = ++mid; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
await new Promise(r => ws.onopen = r);
await send('Page.enable'); await send('Runtime.enable');
await sleep(9000);
await send('Target.activateTarget', { targetId: CDP.id });

const info = await (await send('Runtime.evaluate', { expression: `(() => {
  const inputs = [...document.querySelectorAll('input,select,button')].map(i => ({ tag: i.tagName, type: i.type, name: i.name, id: i.id, ph: (i.placeholder||'').slice(0,30), txt: (i.innerText||'').slice(0,20), vis: !!i.offsetParent }));
  return JSON.stringify({ url: location.href.slice(0,70), title: document.title.slice(0,50), bodyLen: document.body.innerText.length, inputs: inputs.filter(i => i.vis) });
})()`, returnByValue: true })).result?.value;
console.log('INFO:', info);
const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(OUT + '_reg0000_dg_1.png', Buffer.from(shot.data, 'base64'));
ws.close();
console.log('KEEP=' + CDP.id);
