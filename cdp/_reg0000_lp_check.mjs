import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && /letterpad\.app/.test(t.url));
if (!tab) { console.log('no tab'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 8000); });
const c = new CDP(ws);
await c.send('Target.activateTarget', { targetId: tab.id });
await sleep(4000);
for (let i = 0; i < 3; i++) {
  const where = await c.evalT('location.href', 6000);
  console.log('WHERE:', where);
  if (where !== 'TIMEOUT' && where !== 'ERR:' + 'x') break;
  await sleep(2000);
}
console.log('TEXT:', await c.evalT("document.body ? document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,18).join(' | ') : 'nobody'", 8000));
console.log('FORMS:', await c.evalT("JSON.stringify([...document.querySelectorAll('input,select,textarea,button')].map(function(e){return e.tagName+':'+(e.name||e.id||e.type||'')+(e.placeholder?':ph='+e.placeholder:'')}).slice(0,20))", 8000));
const shot = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
if (shot) fs.writeFileSync('D:/Github/seoadminC/storage/_reg0000/lp_siteinfo2.png', Buffer.from(shot.data, 'base64'));
console.log('SHOT ok');
