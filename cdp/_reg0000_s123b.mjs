import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('site123'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
const g = await c.eval(`(function(){
  const b=[...document.querySelectorAll('a,button')].find(e=>e.offsetParent&&(e.innerText||'').trim()==='Get started');
  if(!b) return null; const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});
})()`);
if(!g){console.log('nf');process.exit(1);}
const p=JSON.parse(g); await clickXY(p.x,p.y);
await sleep(7000);
const st = await c.eval(`(function(){
  const inputs=[...document.querySelectorAll('input,button')].filter(i=>i.offsetParent).map(i=>({t:i.type||i.tagName,n:i.name||'',ph:i.placeholder||'',txt:(i.innerText||'').trim().slice(0,18)}));
  return JSON.stringify({url:location.href.slice(0,90), inputs:inputs.slice(0,12)});
})()`);
console.log(st);
process.exit(0);
