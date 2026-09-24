import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('postach.io/register'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
const fill = async (ph, text) => {
  const r = await c.eval(`(function(){ const i=[...document.querySelectorAll('input')].find(x=>x.placeholder===${JSON.stringify(ph)}); if(!i) return null; i.scrollIntoView({block:'center'}); i.focus(); const b=i.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2),v:i.value}); })()`);
  if(!r){ console.log('MISS', ph); return; }
  const p=JSON.parse(r);
  if(p.v) { console.log(ph, 'already has value:', p.v.length, 'chars'); return; }
  await clickXY(p.x,p.y); await sleep(200); await c.send('Input.insertText',{text}); await sleep(150);
};
await fill('First name','Leo');
await fill('Last name','Xm');
await fill('Email address','postach@92ng.com');
await fill('Password','Xx@Pio26!Xm');
console.log('values:', await c.eval(`JSON.stringify([...document.querySelectorAll('input')].filter(x=>x.placeholder).map(x=>x.placeholder.slice(0,6)+'='+x.value.length+'ch'))`, 6000));
// hCaptcha checkbox 区域定位
const zone = await c.eval(`(function(){ const f=[...document.querySelectorAll('iframe')].find(x=>/newassets\.hcaptcha\.com/.test(x.src)); if(!f) return 'no-iframe'; const b=f.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height)}); })()`, 6000);
console.log('hcaptcha zone:', zone);
await sleep(1000);
const shot = await c.send('Page.captureScreenshot', {format:'png'}).catch(()=>null);
if(shot) writeFileSync('D:/Github/seoadminC/storage/_reg0000/postach_filled.png', Buffer.from(shot.data,'base64'));
console.log('SHOT ok');
