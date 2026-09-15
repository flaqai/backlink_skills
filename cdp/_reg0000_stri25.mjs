import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('/edit'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
// 找"博客文章"入口
const bp = await c.eval(`(function(){
  const els=[...document.querySelectorAll('*')].filter(e=>e.offsetParent && e.children.length===0 && e.textContent.trim()==='博客文章');
  if(!els.length) return null; const e=els[0]; e.scrollIntoView({block:'center'});
  const r=e.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});
})()`);
console.log('博客文章:', bp);
if(!bp) process.exit(1);
const p=JSON.parse(bp); await clickXY(p.x,p.y);
await sleep(4000);
const st = await c.eval(`(function(){
  const btns=[...document.querySelectorAll('button, a')].filter(b=>b.offsetParent).map(b=>(b.innerText||'').trim()).filter(t=>t&&t.length<20);
  return JSON.stringify({url:location.href.slice(0,100), text:document.body.innerText.slice(0,500), btns:[...new Set(btns)].slice(0,25)});
})()`);
console.log(st);
process.exit(0);
