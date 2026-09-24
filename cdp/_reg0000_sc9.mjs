import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// scoop.it captcha v3: click checkbox then immediate full-page burst
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('scoop.it'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
// fresh checkbox position
const cb = await c.evalT(`(function(){ const f=[...document.querySelectorAll('iframe')].find(x=>/hcaptcha/.test(x.src||'')&&x.offsetWidth>40&&x.offsetHeight>40); if(!f) return 'NO_IF'; const b=f.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+31),y:Math.round(b.y+31)}); })()`, 8000);
console.log('checkbox:', cb);
if(!cb.startsWith('{')) process.exit(1);
const p = JSON.parse(cb);
await clickXY(p.x, p.y);
await sleep(4500);
for (let i = 1; i <= 3; i++) {
  const shot = await c.send('Page.captureScreenshot', {format:'png'});
  writeFileSync(`D:/Github/seoadminC/storage/_reg0000/sch${i}.png`, Buffer.from(shot.data,'base64'));
  if (i < 3) await sleep(1300);
}
console.log('burst done');
process.exit(0);
