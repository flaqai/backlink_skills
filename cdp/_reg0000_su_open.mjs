// reg0000: suomiblog 注册侦察——开tab+等渲染+截图+dump表单
import fs from 'fs';
const OUT = 'D:/Github/backlink_skills/storage/tmp/';
const tabUrl = process.argv[2] || 'https://suomiblog.com/register';

const CDP = await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent(tabUrl), { method: 'PUT' }).then(r => r.json());
console.log('tabId=', CDP.id);
const ws = new WebSocket(CDP.webSocketDebuggerUrl);
let mid = 0;
const pending = new Map();
function send(method, params = {}, sessionId) {
  return new Promise((res, rej) => {
    const id = ++mid;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
}
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id).res(m.result); pending.delete(m.id); }
};
await new Promise(r => ws.onopen = r);

const sleep = ms => new Promise(r => setTimeout(r, ms));
await sleep(4000);
await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url: tabUrl });
await sleep(6000);

const evaljs = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  return r.result?.value;
};

// 页面状态
const info = await evaljs(`(() => ({ url: location.href, title: document.title, ready: document.readyState, bodyLen: document.body ? document.body.innerText.length : -1 }))()`);
console.log('INFO:', JSON.stringify(info));

// 表单结构
const form = await evaljs(`(() => {
  const forms = [...document.querySelectorAll('form')].map(f => ({ action: f.action, method: f.method, id: f.id, cls: f.className }));
  const inputs = [...document.querySelectorAll('input,select,button')].map(i => ({ tag: i.tagName, type: i.type, name: i.name, id: i.id, cls: (i.className||'').toString().slice(0,40), value: (i.type==='password'?'':(i.value||'')).toString().slice(0,30), visible: !!(i.offsetParent) }));
  return { forms, inputs };
})()`);
console.log('FORM:', JSON.stringify(form, null, 1));

// 截图
const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(OUT + '_reg0000_su_shot1.png', Buffer.from(shot.data, 'base64'));
console.log('shot saved');
await send('Target.activateTarget', { targetId: CDP.id });
ws.close();
console.log('TAB_KEEP=' + CDP.id);
