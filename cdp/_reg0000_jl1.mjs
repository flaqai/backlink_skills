import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// jiliblog: login via browser (cloud spinner 20-30s is normal, do NOT judge dead)
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('jiliblog'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
const fill = async (sel, text) => {
  const r = await c.eval(`(function(){ const i=${sel}; if(!i) return null; i.scrollIntoView({block:'center'}); i.focus(); const b=i.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}); })()`);
  if(!r){ console.log('MISS', sel); return; }
  const p=JSON.parse(r); await clickXY(p.x,p.y); await sleep(200); await c.send('Input.insertText',{text}); await sleep(200);
};
await fill(`document.querySelector('input[name=log]')||document.querySelector('input[type=text]')`,'leoxm26');
await fill(`document.querySelector('input[type=password]')`,'Xx@Jlb26!Xm');
// submit
const btn = await c.evalT(`(function(){ const b=[...document.querySelectorAll('button,input[type=submit],a')].find(x=>/log.?in/i.test((x.innerText||x.value||'').trim())&&x.offsetParent); if(!b) return null; b.scrollIntoView({block:'center'}); const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`, 8000);
console.log('login btn:', btn);
if(!btn) process.exit(1);
const p=JSON.parse(btn); await clickXY(p.x,p.y);
// wait up to 40s for dashboard/editor
for (let i=0;i<8;i++){
  await sleep(5000);
  const u = await c.evalT(`location.href.slice(0,80)`, 5000);
  if (!/login|wp-login/i.test(u)) { console.log('landed:', u); break; }
  console.log('waiting login...', u);
}
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/jl_login.png', Buffer.from(shot.data,'base64'));
process.exit(0);
