import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

// reg0000b3: 重载+抓登录 XHR 真实响应
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())]
  .find(t => t.type === 'page' && /teletype\.in/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Network.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });

// reload
await c.send('Page.reload'); await sleep(5000);
console.log('URL:', await c.evalT('location.href', 6000));

const xhrs = [];
c.on(m => {
  if (m.method === 'Network.requestWillBeSent' && /api|auth|login/.test(m.params.request.url) && !/static|push|analytics/.test(m.params.request.url)) {
    xhrs.push({ id: m.params.requestId, u: m.params.request.url.slice(0, 110), meth: m.params.request.method, body: (m.params.request.postData || '').slice(0, 200) });
  }
  if (m.method === 'Network.responseReceived') {
    const x = xhrs.find(v => v.id === m.params.requestId);
    if (x) x.status = m.params.response.status;
  }
  if (m.method === 'Network.loadingFailed') {
    const x = xhrs.find(v => v.id === m.params.requestId);
    if (x) x.failed = (m.params.errorText || '').slice(0, 60);
  }
});

await ev('mouseMoved', { x: 675, y: 354 }); await sleep(120);
await ev('mousePressed', { x: 675, y: 354, button: 'left', clickCount: 1 }); await sleep(80);
await ev('mouseReleased', { x: 675, y: 354, button: 'left', clickCount: 1 }); await sleep(300);
await c.send('Input.insertText', { text: 'teletype@92ng.com' }); await sleep(600);
await ev('mouseMoved', { x: 675, y: 401 }); await sleep(120);
await ev('mousePressed', { x: 675, y: 401, button: 'left', clickCount: 1 }); await sleep(80);
await ev('mouseReleased', { x: 675, y: 401, button: 'left', clickCount: 1 });
await sleep(9000);

console.log('XHR:', JSON.stringify(xhrs, null, 1).slice(0, 1200));
console.log('BODY:', await c.evalT("document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,10).join(' | ').slice(0,250)", 6000));
process.exit(0);
