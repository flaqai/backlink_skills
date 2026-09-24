import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('site123'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
await clickXY(886,543); // Blog 卡片
await sleep(5000);
const st = await c.eval(`(function(){
  const inputs=[...document.querySelectorAll('input,button')].filter(i=>i.offsetParent).map(i=>({t:i.type||i.tagName,n:i.name||'',ph:(i.placeholder||'').slice(0,28),txt:(i.innerText||'').trim().slice(0,18)}));
  return JSON.stringify({url:location.href.slice(0,95), step:document.body.innerText.match(/Step \d/)?.[0], inputs:inputs.slice(0,14)});
})()`);
console.log(st);
process.exit(0);
