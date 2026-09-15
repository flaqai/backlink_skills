import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('inube.com/register'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
const click = async (x,y) => { await ev('mouseMoved',{x,y}); await sleep(120); await ev('mousePressed',{x,y,button:'left',clickCount:1}); await sleep(80); await ev('mouseReleased',{x,y,button:'left',clickCount:1}); await sleep(450); };
for (const [x,y] of [[712,400],[809,400],[712,496],[809,496]]) await click(x,y);
await click(794,679);
await sleep(3000);
const tk = await c.evalT("[document.getElementById('g-recaptcha-response')].map(function(e){return e&&e.value?'HAS('+e.value.length+')':'NONE';}).join(',')", 5000);
console.log('TOKEN:', tk);
if (tk.indexOf('NONE') >= 0) {
  const s = await c.send('Page.captureScreenshot', {format:'jpeg', quality:80}).catch(()=>null);
  if(s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/inube_f4.jpg', Buffer.from(s.data,'base64'));
  console.log('shot4');
} else {
  // 有token! 立即提交Join
  const ev2 = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
  await ev2('mouseMoved',{x:690,y:490}); await sleep(150);
  await ev2('mousePressed',{x:690,y:490,button:'left',clickCount:1}); await sleep(100);
  await ev2('mouseReleased',{x:690,y:490,button:'left',clickCount:1});
  await sleep(6000);
  console.log('URL:', await c.evalT('location.href', 6000));
  console.log('BODY:', await c.evalT("document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,10).join(' | ')", 7000));
  const s2 = await c.send('Page.captureScreenshot', {format:'png'}).catch(()=>null);
  if(s2) writeFileSync('D:/Github/seoadminC/storage/_reg0000/inube_joined.png', Buffer.from(s2.data,'base64'));
  console.log('JOINED shot');
}
