import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// scoop.it signup v3: JS-trigger bypass, fill form, screenshot for captcha
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('scoop.it'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
const fill = async (name, text) => {
  const r = await c.eval(`(function(){ const i=document.querySelector('#subscriptionForm input[name=${JSON.stringify(name)}]'); if(!i) return null; i.scrollIntoView({block:'center'}); i.focus(); const b=i.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2),vis:b.width>0}); })()`);
  if(!r || r==='TIMEOUT'){ console.log('MISS', name); return false; }
  const p=JSON.parse(r); if(!p.vis){ console.log('INVIS', name); return false; }
  await clickXY(p.x,p.y); await sleep(200); await c.send('Input.insertText',{text}); await sleep(250);
  return true;
};
// trigger bypass via JS (onclick attribute form)
const trig = await c.evalT(`(function(){ const a=document.querySelector('.signup-bypass a.bypass'); if(!a) return 'NO_LINK'; a.click(); return 'CLICKED'; })()`, 8000);
console.log('bypass trigger:', trig);
await sleep(3500);
const r1 = await fill('displayName','Leo Xm'); console.log('displayName:', r1);
await sleep(1500);
const r2 = await fill('shortName','leoxm26'); console.log('shortName:', r2);
const r3 = await fill('email','scoopit@92ng.com'); console.log('email:', r3);
const r4 = await fill('password','Xx@Scoop26!Xm'); console.log('password:', r4);
await sleep(2000);
const st = await c.evalT(`(function(){ const f=document.querySelector('#subscriptionForm'); const errs=[...f.querySelectorAll('.error')].filter(e=>e.offsetParent&&e.innerText.trim()).map(e=>e.innerText.trim().slice(0,60)); const btn=[...f.querySelectorAll('button,input[type=submit]')].filter(b=>b.offsetParent).map(b=>({t:b.tagName,txt:(b.innerText||b.value||'').trim().slice(0,30)})); const cap=document.querySelector('.g-recaptcha iframe, .g-recaptcha [title]'); return JSON.stringify({errs, btn, captchaVis: !!document.querySelector('.g-recaptcha iframe'), url: location.href.slice(0,80)}); })()`, 10000);
console.log('state:', st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/sc_filled.png', Buffer.from(shot.data,'base64'));
process.exit(0);
