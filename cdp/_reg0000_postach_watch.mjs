import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('postach.io/register'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Network.enable');
const reqs = [];
c.on(m => {
  if (m.method === 'Network.requestWillBeSent') { const u = m.params.request.url; if (!/\.(png|css|js|woff|jpg|gif|ico)/.test(u) && !/facebook|google-analytics|googletag|stripe|hcaptcha/.test(u)) reqs.push(m.params.request.method + ' ' + u.slice(0,130)); }
  if (m.method === 'Network.responseReceived') { const u = m.params.response.url; if (!/\.(png|css|js|woff|jpg|gif|ico)/.test(u) && !/facebook|google-analytics|googletag|stripe|hcaptcha/.test(u)) reqs.push('  ← ' + m.params.response.status + ' ' + u.slice(0,110)); }
});
for (let i = 0; i < 5; i++) {
  await sleep(6000);
  const st = await c.evalT("location.href.slice(0,80) + ' ||| ' + (document.querySelector('button') ? [...document.querySelectorAll('button')].map(function(b){return (b.innerText||'').trim().slice(0,20)||'spinner';}).join(',') : 'nobodyet')", 6000);
  console.log((i+1)*6 + 's:', st.slice(0, 160));
}
console.log('--- captured reqs ---');
reqs.slice(-12).forEach(r => console.log(r));
const shot = await c.send('Page.captureScreenshot', {format:'png'}).catch(()=>null);
if(shot) writeFileSync('D:/Github/seoadminC/storage/_reg0000/postach_watch.png', Buffer.from(shot.data,'base64'));
console.log('SHOT ok');
