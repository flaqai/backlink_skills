import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' });
await sleep(300);
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.filter(t => t.type === 'page' && /about:blank/.test(t.url)).pop();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 8000); });
const c = new CDP(ws);
await c.send('Target.activateTarget', { targetId: tab.id });
await c.send('Page.enable');
const r = await c.send('Page.navigate', { url: 'https://letterpad.app/update/site-info' }).catch(e => ({err: e.message}));
console.log('nav:', JSON.stringify(r).slice(0, 200));
for (let i = 0; i < 4; i++) {
  await sleep(2500);
  console.log(i, 'URL:', await c.evalT('location.href', 5000));
}
console.log('TEXT:', await c.evalT("document.body ? document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,16).join(' | ') : 'nobody'", 8000));
const shot = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
if (shot) fs.writeFileSync('D:/Github/seoadminC/storage/_reg0000/lp_nav2.png', Buffer.from(shot.data, 'base64'));
console.log('SHOT ok');
