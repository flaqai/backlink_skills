import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('postach.io/register'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Network.enable'); await c.send('Runtime.enable'); await c.send('Log.enable');
const reqs = [], errs = [];
c.on(m => {
  if (m.method === 'Network.requestWillBeSent' && m.params.request.method === 'POST') reqs.push('POST ' + m.params.request.url.slice(0,140) + ' :: ' + String(m.params.request.postData||'').slice(0,120));
  if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) reqs.push('  ERR' + m.params.response.status + ' ' + m.params.response.url.slice(0,110));
  if (m.method === 'Runtime.exceptionThrown') errs.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text || '').slice(0,200));
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push(m.params.args.map(a=>a.value||a.description||'').join(' ').slice(0,200));
  if (m.method === 'Log.entryAdded') errs.push(m.params.entry.text.slice(0,150));
});
const nb = await c.eval(`(function(){ const b=[...document.querySelectorAll('button')].find(x=>(x.innerText||'').trim()==='Next'&&x.offsetParent&&!x.disabled); if(!b) return null; const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`, 6000);
console.log('btn:', nb);
if (nb) {
  const p = JSON.parse(nb);
  await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x,y:p.y}); await sleep(200);
  await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',clickCount:1}); await sleep(120);
  await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x,y:p.y,button:'left',clickCount:1});
}
await sleep(10000);
console.log('--- POST/err reqs ---'); reqs.slice(-6).forEach(r => console.log(r));
console.log('--- JS errors ---'); errs.slice(-6).forEach(r => console.log(r));
console.log('BODY:', await c.evalT("document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,8).join(' | ')", 6000));
const shot = await c.send('Page.captureScreenshot', {format:'png'}).catch(()=>null);
if(shot) writeFileSync('D:/Github/seoadminC/storage/_reg0000/postach_diag.png', Buffer.from(shot.data,'base64'));
