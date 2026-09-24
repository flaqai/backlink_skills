import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

// reg0000b2: teletype magic-link 注册 (email→Sign In)
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())]
  .find(t => t.type === 'page' && /teletype\.in/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Network.enable');
const reqs = [];
c.on(m => {
  if (m.method === 'Network.requestWillBeSent' && m.params.request.method === 'POST'
      && !/google|facebook|analytics|sentry/.test(m.params.request.url))
    reqs.push('POST ' + m.params.request.url.slice(0, 110) + ' ' + (m.params.request.postData || '').slice(0, 150));
});
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`).catch(() => {});
await sleep(500);

await ev('mouseMoved', { x: 675, y: 354 }); await sleep(120);
await ev('mousePressed', { x: 675, y: 354, button: 'left', clickCount: 1 }); await sleep(80);
await ev('mouseReleased', { x: 675, y: 354, button: 'left', clickCount: 1 }); await sleep(300);
await c.send('Input.insertText', { text: 'teletype@92ng.com' }); await sleep(600);
// Sign In
await ev('mouseMoved', { x: 675, y: 401 }); await sleep(120);
await ev('mousePressed', { x: 675, y: 401, button: 'left', clickCount: 1 }); await sleep(80);
await ev('mouseReleased', { x: 675, y: 401, button: 'left', clickCount: 1 });
await sleep(4000);

console.log('URL:', await c.evalT('location.href', 6000));
console.log('BODY:', await c.evalT("document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,10).join(' | ').slice(0,300)", 6000));
const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/tt_sent.png', Buffer.from(s.data, 'base64'));
console.log('REQS:', JSON.stringify(reqs.slice(0, 5)));
console.log('SHOT ok');
process.exit(0);
