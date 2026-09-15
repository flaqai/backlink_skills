// _reg0000_daB.mjs — deviantart 填email/password+继续 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /deviantart\.com/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(800);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(6000)]);
for (const [id, val] of [['email','da@92ng.com'],['password','Xx@Da26!Xm']]) {
  const r = await Promise.race([c.evalT(`(() => { const i=document.getElementById('${id}'); if(!i) return 'nf'; i.scrollIntoView({block:'center'}); i.focus(); return 'ok'; })()`, 8000), sleep(9000).then(()=>'TO')]);
  console.log(id, 'focus:', r);
  if (r === 'ok') { await c.send('Input.insertText', {text: val}); await sleep(600); }
}
// 点 Continue with Email
const r = await Promise.race([c.evalT(`(() => { const b=[...document.querySelectorAll('button')].find(b=>b.offsetParent && /continue with email/i.test(b.innerText)); if(!b) return 'nf'; const rc=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(rc.x+rc.width/2), y:Math.round(rc.y+rc.height/2)}); })()`, 8000), sleep(9000).then(()=>'TO')]);
console.log('BTN:', r);
if (r && r.startsWith('{')) {
  const {x,y} = JSON.parse(r);
  await c.send('Input.dispatchMouseEvent', {type:'mouseMoved', x, y});
  await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x, y, button:'left', clickCount:1});
  await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x, y, button:'left', clickCount:1});
  await sleep(5000);
}
const st = await Promise.race([c.evalT(`(() => JSON.stringify({url: location.href.slice(0,90), body: (document.body.innerText||'').replace(/\s+/g,' ').slice(0,250), fields: [...document.querySelectorAll('input')].filter(e=>e.offsetParent).map(e=>({type:e.type,name:e.name,ph:e.placeholder})).slice(0,8)}))()`, 10000), sleep(11000).then(()=>'TO')]);
console.log('AFTER:', typeof st === 'string' ? st : 'TO');
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(8000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_da2.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
