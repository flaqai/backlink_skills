import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('blogPosts'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
const e = await c.eval(`(function(){
  const els=[...document.querySelectorAll('button, a, div[role=button]')].filter(el=>el.offsetParent && (el.textContent||'').trim()==='撰写新博文');
  if(!els.length) return null; const el=els[0]; el.scrollIntoView({block:'center'});
  const r=el.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});
})()`);
console.log('btn:', e);
if(!e) process.exit(1);
const p=JSON.parse(e); await clickXY(p.x,p.y);
await sleep(6000);
const st = await c.eval(`(function(){
  const inputs=[...document.querySelectorAll('input,textarea')].filter(i=>i.offsetParent).map(i=>({t:i.tagName,id:i.id,ph:i.placeholder,cls:String(i.className).slice(0,30)}));
  return JSON.stringify({url:location.href.slice(0,110), inputs:inputs.slice(0,10), txt:document.body.innerText.slice(0,300)});
})()`);
console.log(st);
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/seoadminC/storage/_stri-newpost.png', Buffer.from(shot.data, 'base64'));
process.exit(0);
