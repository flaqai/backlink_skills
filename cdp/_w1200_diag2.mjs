import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
// win1200 诊断: 打开指定URL, 截图+关键DOM判定
const url = process.argv[2];
const out = process.argv[3] || '_w1200_diag.png';
const t = await (await fetch('http://127.0.0.1:9224/json/new?' + url, { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
for (let i = 0; i < 10; i++) await sleep(1500);
const st = await cdp.eval(`JSON.stringify({url: location.href.slice(0,140), title: document.title.slice(0,80), hasTitleBox: !!document.querySelector('#title'), hasTa: !!document.querySelector('textarea#content'), loginHint: /log.?in|sign.?in/i.test((document.querySelector('body')||{innerText:''}).innerText.slice(0,2000)), adminBar: !!document.querySelector('#wpadminbar'), bodyTxt: (document.querySelector('body')||{innerText:''}).innerText.replace(/\\s+/g,' ').slice(0,300)})`);
console.log(st);
await cdp.send('Page.captureScreenshot', {}).then(r => {
  fs.writeFileSync(out, Buffer.from(r.data, 'base64'));
});
console.log('SHOT', out, 'TAB', t.id);
