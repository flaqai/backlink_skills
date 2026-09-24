import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('inube.com/register'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
const click = async (x,y) => { await ev('mouseMoved',{x,y}); await sleep(120); await ev('mousePressed',{x,y,button:'left',clickCount:1}); await sleep(80); await ev('mouseReleased',{x,y,button:'left',clickCount:1}); await sleep(450); };
for (const [x,y] of [[615,400],[712,400],[615,496],[712,496],[712,304]]) await click(x,y);
await click(794,679);
await sleep(3000);
const tk = await c.evalT("[document.getElementById('g-recaptcha-response')].map(function(e){return e&&e.value?'HAS('+e.value.length+')':'NONE';}).join(',')", 5000);
console.log('TOKEN:', tk);
if (tk.indexOf('NONE') >= 0) {
  const s = await c.send('Page.captureScreenshot', {format:'jpeg', quality:80}).catch(()=>null);
  if(s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/inube_f3.jpg', Buffer.from(s.data,'base64'));
  console.log('shot3');
}
