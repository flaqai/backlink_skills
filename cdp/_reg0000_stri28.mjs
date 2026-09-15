import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('/edit'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
const e = await c.eval(`(function(){
  const els=[...document.querySelectorAll('*')].filter(el=>el.offsetParent && el.children.length<=1 && (el.textContent||'').includes('点击这里开始编辑'));
  if(!els.length) return null; const el=els[els.length-1]; el.scrollIntoView({block:'center'});
  const r=el.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});
})()`);
console.log('entry:', e);
if(!e) process.exit(1);
const p=JSON.parse(e); await clickXY(p.x,p.y);
await sleep(5000);
const st = await c.eval(`(function(){
  return JSON.stringify({url:location.href.slice(0,110), txt:document.body.innerText.slice(0,400)});
})()`);
console.log(st);
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/seoadminC/storage/_stri-postedit.png', Buffer.from(shot.data, 'base64'));
process.exit(0);
