import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('postach.io/register'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Network.enable');
const reqs = [];
c.on(m => {
  if (m.method === 'Network.requestWillBeSent') { const u = m.params.request.url; if (!/\.(png|css|js|woff|jpg|gif|ico)/.test(u) && !/facebook|stripe|analytics/.test(u)) reqs.push(m.params.request.method + ' ' + u.slice(0,130) + ' POSTDATA:' + String(m.params.request.postData||'').slice(0,150)); }
  if (m.method === 'Network.responseReceived') { const u = m.params.response.url; if (!/\.(png|css|js|woff|jpg|gif|ico)/.test(u) && !/facebook|stripe|analytics/.test(u)) reqs.push('  ← ' + m.params.response.status + ' ' + u.slice(0,110)); }
});
console.log('token len:', await c.evalT("[document.getElementById('h-captcha-response'),document.getElementById('g-recaptcha-response')].map(function(e){return e?e.value.length:-1;}).join(',')", 6000));
// 再点一次 Next
const nb = await c.eval(`(function(){ const b=[...document.querySelectorAll('button')].find(x=>(x.innerText||'').trim()==='Next'&&x.offsetParent); if(!b) return null; const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),dis:b.disabled}); })()`, 6000);
console.log('nextBtn:', nb);
if (nb) {
  const p = JSON.parse(nb);
  await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x,y:p.y}); await sleep(200);
  await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',clickCount:1}); await sleep(120);
  await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x,y:p.y,button:'left',clickCount:1});
  await sleep(8000);
}
console.log('URL:', await c.evalT('location.href', 6000));
console.log('BODY:', await c.evalT("document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,8).join(' | ')", 6000));
reqs.slice(-8).forEach(r => console.log(r));
const shot = await c.send('Page.captureScreenshot', {format:'png'}).catch(()=>null);
if(shot) writeFileSync('D:/Github/seoadminC/storage/_reg0000/postach_token.png', Buffer.from(shot.data,'base64'));
console.log('SHOT ok');
