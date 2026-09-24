import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('postach.io'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable'); await c.send('Log.enable');
const logs = [];
c.on((m) => {
  if (m.method === 'Runtime.consoleAPICalled') { const p=m.params||{}; if(['error','warning'].includes(p.type)) logs.push(p.type+': '+(p.args||[]).map(a=>a.value||a.description||'').join(' ').slice(0,200)); }
  else if (m.method === 'Runtime.exceptionThrown') { const d=(m.params||{}).exceptionDetails||{}; logs.push('EXC: '+(d.text||'')+' '+(((d.exception||{}).description)||'').slice(0,200)); }
  else if (m.method === 'Log.entryAdded') { const e=(m.params||{}).entry||{}; if(e.level==='error') logs.push('LOG: '+(e.text||'').slice(0,200)+' @'+(e.url||'').slice(0,60)); }
});
// reload and redo the whole flow with console capture
await c.send('Page.navigate', {url:'https://postach.io/register/create'});
await sleep(9000);
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
const fill = async (name, text) => {
  const r = await c.eval(`(function(){ const i=document.querySelector('input[name=${JSON.stringify(name)}]'); if(!i) return null; i.scrollIntoView({block:'center'}); i.focus(); const b=i.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}); })()`);
  if(!r){ console.log('MISS', name); return; }
  const p=JSON.parse(r); await clickXY(p.x,p.y); await sleep(150); await c.send('Input.insertText',{text}); await sleep(150);
};
await fill('first','Leo'); await fill('last','Xm'); await fill('email','postach@92ng.com'); await fill('password','Xx@Pio26!Xm');
console.log('FILLED, clicking Next');
const nb = await c.eval(`(function(){ const b=[...document.querySelectorAll('button')].find(x=>(x.innerText||'').trim()==='Next'&&x.offsetParent); if(!b) return null; b.scrollIntoView({block:'center'}); const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`);
if(!nb){ console.log('NO NEXT BTN'); process.exit(1); }
const p=JSON.parse(nb); await clickXY(p.x,p.y);
console.log('NEXT CLICKED, waiting challenge');
await sleep(6000);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/pa_round2.png', Buffer.from(shot.data,'base64'));
console.log('CONSOLE LOGS SO FAR:', JSON.stringify(logs.slice(0,10)));
process.exit(0);
