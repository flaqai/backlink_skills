import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('strikingly.com'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(8000);
const st = await c.eval(`(function(){
  const btns=[...document.querySelectorAll('button, a')].filter(b=>b.offsetParent).map(b=>(b.innerText||'').trim()).filter(t=>t&&t.length<25);
  return JSON.stringify({url:location.href.slice(0,90), text:document.body.innerText.slice(0,400), btns:[...new Set(btns)].slice(0,30)});
})()`);
console.log(st);
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/seoadminC/storage/_stri-edit.png', Buffer.from(shot.data, 'base64'));
process.exit(0);
