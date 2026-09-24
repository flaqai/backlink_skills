import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('publish0x'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const st = await c.eval(`(function(){
  const btns=[...document.querySelectorAll('button, input[type=submit]')].filter(b=>b.offsetParent).map(b=>(b.innerText||b.value||'').trim()).filter(t=>t);
  const labels=[...document.querySelectorAll('label, p, h2, h3')].filter(e=>e.offsetParent).map(e=>e.textContent.trim()).filter(t=>t&&t.length<60);
  return JSON.stringify({btns:btns.slice(0,8), labels:labels.slice(0,12)});
})()`);
console.log(st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_p0x-reg.png', Buffer.from(shot.data,'base64'));
process.exit(0);
