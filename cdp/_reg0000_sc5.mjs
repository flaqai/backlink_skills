import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// scoop.it: set select, scroll to captcha, click checkbox, screenshot challenge
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('scoop.it'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
// set select natively + change event
const sv = await c.evalT(`(function(){ const s=document.querySelector('#subscriptionForm select'); s.value='My personal brand or blog'; s.dispatchEvent(new Event('change',{bubbles:true})); return s.value; })()`, 8000);
console.log('select set:', sv);
await sleep(800);
// find hcaptcha checkbox iframe and click
const cb = await c.evalT(`(function(){ window.scrollTo(0, document.body.scrollHeight); const f=[...document.querySelectorAll('iframe')].find(x=>/hcaptcha/.test(x.src||'')&&x.offsetWidth>40); if(!f) return 'NO_CAP_IFRAME'; const b=f.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+31),y:Math.round(b.y+31),w:b.width,h:b.height}); })()`, 8000);
console.log('captcha box:', cb);
if (cb.startsWith('{')) {
  const p=JSON.parse(cb);
  await clickXY(p.x, p.y);
  await sleep(5000);
}
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/sc_cap.png', Buffer.from(shot.data,'base64'));
console.log('done');
process.exit(0);
