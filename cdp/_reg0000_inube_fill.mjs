import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('inube.com/register'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
const fill = async (name, text, y) => {
  const r = await c.eval(`(function(){ const i=document.querySelector('input[name=${JSON.stringify(name)}]'); if(!i) return null; i.scrollIntoView({block:'center'}); i.focus(); const b=i.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}); })()`);
  if(!r){ console.log('MISS', name); return; }
  const p=JSON.parse(r); await ev('mouseMoved',{x:p.x,y:p.y}); await ev('mousePressed',{x:p.x,y:p.y,button:'left',clickCount:1}); await ev('mouseReleased',{x:p.x,y:p.y,button:'left',clickCount:1}); await sleep(200);
  await c.send('Input.insertText',{text}); await sleep(150);
};
await fill('join_name','Leo');
await fill('join_surname','Xm');
await fill('join_email','inube3@92ng.com');
console.log('vals:', await c.eval(`JSON.stringify(['join_name','join_surname','join_email'].map(function(n){var i=document.querySelector('input[name='+n+']');return n+'='+i.value;}))`, 6000));
// 点 reCAPTCHA checkbox（截图坐标 437,417）
await ev('mouseMoved',{x:437,y:417}); await sleep(300);
await ev('mousePressed',{x:437,y:417,button:'left',clickCount:1}); await sleep(120);
await ev('mouseReleased',{x:437,y:417,button:'left',clickCount:1});
await sleep(5000);
const shot = await c.send('Page.captureScreenshot', {format:'png'}).catch(()=>null);
if(shot) writeFileSync('D:/Github/seoadminC/storage/_reg0000/inube_challenge.png', Buffer.from(shot.data,'base64'));
console.log('SHOT ok');
