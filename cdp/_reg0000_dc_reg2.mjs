import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const [,, tid, user, emailUser, pass] = process.argv;
const t = await (await fetch('http://127.0.0.1:9224/json/list')).json().then(l => l.find(x => x.id === tid));
if (!t) { console.log('NO_TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tid, { method: 'PUT' }).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
let ready = false;
for (let i = 0; i < 8; i++) {
  ready = await c.eval(`!!document.querySelector('#btn-create')`).catch(() => false);
  if (ready) break;
  await sleep(2500);
}
if (!ready) { console.log('NO_FORM'); process.exit(2); }
const fill = async (sel, text) => {
  const r = await c.eval(`(function(){ const i=document.querySelector('${sel}'); if(!i) return null; i.scrollIntoView({block:'center'}); i.focus(); const b=i.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}); })()`);
  if(!r){ console.log('MISS', sel); return; }
  const p=JSON.parse(r); await clickXY(p.x,p.y); await sleep(200); await c.send('Input.insertText',{text}); await sleep(200);
};
await fill('input[name=alias]', user);
await fill('input[name=email]', emailUser+'@92ng.com');
await fill('input[name=pass]', pass);
const btn = await c.eval(`(function(){ const b=document.querySelector('#btn-create'); b.scrollIntoView({block:'center'}); const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),txt:(b.innerText||b.value||'').trim().slice(0,30)}); })()`);
const p = JSON.parse(btn); await clickXY(p.x, p.y);
console.log('SUBMITTED via', p.txt);
await sleep(8000);
const after = await c.eval(`(function(){ return JSON.stringify({url:location.href.slice(0,140), head:document.body.innerText.replace(/\s+/g,' ').slice(0,300)}); })()`);
console.log('AFTER:', after);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000_dc_'+ (t.url.match(/([a-z0-9.-]+)\//i)?.[1]||'x').replace(/[^a-z]/g,'') +'.png', Buffer.from(shot.data,'base64'));
process.exit(0);
