import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// postach.io reg0000 retry: fresh /register/create, fill form, trigger captcha, screenshot
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('postach.io'));
if (tab) { try { await fetch('http://127.0.0.1:9224/json/close/' + tab.id); } catch(e){} await sleep(800); }
tab = await (await fetch('http://127.0.0.1:9224/json/new?https://postach.io/register/create', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(9000);
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
const fill = async (name, text) => {
  const r = await c.eval(`(function(){ const i=document.querySelector('input[name=${JSON.stringify(name)}]'); if(!i) return null; i.scrollIntoView({block:'center'}); i.focus(); const b=i.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}); })()`);
  if(!r){ console.log('MISS', name); return; }
  const p=JSON.parse(r); await clickXY(p.x,p.y); await sleep(200); await c.send('Input.insertText',{text}); await sleep(200);
};
await fill('first','Leo');
await fill('last','Xm');
await fill('email','postach@92ng.com');
await fill('password','Xx@Pio26!Xm');
console.log('FORM FILLED');
// find hcaptcha checkbox iframe and click it
const cb = await c.eval(`(function(){ const f=[...document.querySelectorAll('iframe')].find(x=>/hcaptcha/.test(x.src||'')); if(!f) return 'NO_IFRAME'; const b=f.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+30),y:Math.round(b.y+30),src:(f.src||'').slice(0,60)}); })()`);
console.log('checkbox:', cb);
if (cb !== 'NO_IFRAME') {
  const p = JSON.parse(cb);
  await clickXY(p.x, p.y);
  await sleep(5000);
}
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/pa_captcha.png', Buffer.from(shot.data,'base64'));
console.log('TABID=' + tab.id);
process.exit(0);
