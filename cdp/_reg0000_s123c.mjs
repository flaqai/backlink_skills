import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('site123'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(5000);
const st = await c.eval(`(function(){
  const inputs=[...document.querySelectorAll('input,button,select')].filter(i=>i.offsetParent).map(i=>({t:i.type||i.tagName,n:i.name||'',ph:(i.placeholder||'').slice(0,25),txt:(i.innerText||'').trim().slice(0,18)}));
  return JSON.stringify({url:location.href.slice(0,95), inputs:inputs.slice(0,14), txt:document.body.innerText.slice(0,200)});
})()`);
console.log(st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_s123-s2.png', Buffer.from(shot.data,'base64'));
process.exit(0);
