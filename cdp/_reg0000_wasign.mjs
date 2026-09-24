import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// writeablog.net /signup fill (ezblogz variant: usr/email/pass/ckb)
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('writeablog.net'));
if (tab) { try { await fetch('http://127.0.0.1:9224/json/close/' + tab.id); } catch(e){} await sleep(500); }
tab = await (await fetch('http://127.0.0.1:9224/json/new?https://writeablog.net/signup', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(8000);
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
const fill = async (sel, text) => {
  const r = await c.eval(`(function(){ const i=${sel}; if(!i) return null; i.scrollIntoView({block:'center'}); i.focus(); const b=i.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}); })()`);
  if(!r){ console.log('MISS', sel); return; }
  const p=JSON.parse(r); await clickXY(p.x,p.y); await sleep(200); await c.send('Input.insertText',{text}); await sleep(200);
};
const st = await c.evalT(`(function(){ const inputs=[...document.querySelectorAll('input,button')].filter(x=>x.offsetParent).map(x=>({tag:x.tagName,type:x.type||'',id:x.id||'',name:x.name||'',txt:(x.innerText||x.value||'').slice(0,25)})); return JSON.stringify({url:location.href.slice(0,80), inputs:inputs.slice(0,14)}); })()`, 10000);
console.log(st);
await fill(`document.querySelector('input[name=usr]')||document.querySelector('#field-user')||document.querySelector('input[type=text]')`,'leoxm26');
await fill(`document.querySelector('input[name=email]')||document.querySelector('input[type=email]')`,'writeablog@92ng.com');
await fill(`document.querySelector('input[type=password]')`,'Xx@Wab26!Xm');
const cb = await c.eval(`(function(){ const b=document.querySelector('.captcha_checkbox, [class*=captcha] input, [class*=Captcha]'); if(!b) return null; b.scrollIntoView({block:'center'}); const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`);
console.log('captcha el:', cb);
if(cb){ const p=JSON.parse(cb); await clickXY(p.x,p.y); await sleep(4000); }
const task = await c.eval(`(function(){ const m=document.body.innerText.match(/Select all images with ([^.]+)/); return m?m[1]:'?'; })()`);
console.log('TASK:', task);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/wa_cap.png', Buffer.from(shot.data,'base64'));
process.exit(0);
