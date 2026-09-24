import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('site123'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
const sb = await c.eval(`(function(){
  const b=[...document.querySelectorAll('input[type=submit],button')].find(e=>e.offsetParent&&(e.innerText||e.value||'').includes('Start my website'));
  if(!b) return null; b.scrollIntoView({block:'center'}); const r=b.getBoundingClientRect();
  return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});
})()`);
console.log('submit:', sb);
if(sb){const p=JSON.parse(sb);
  await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x,y:p.y});
  await sleep(600);
  await clickXY(p.x,p.y);
}
await sleep(10000);
const st = await c.eval(`(function(){
  return JSON.stringify({url:location.href.slice(0,100), txt:document.body.innerText.slice(0,250)});
})()`);
console.log(st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_s123-s4.png', Buffer.from(shot.data,'base64'));
process.exit(0);
