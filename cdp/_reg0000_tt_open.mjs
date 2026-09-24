import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

// reg0000b: teletype.in login SPA 侦察
const mk = await fetch('http://127.0.0.1:9224/json/new?https://teletype.in/login', { method: 'PUT' }).then(r => r.json());
await sleep(1500);
await fetch(`http://127.0.0.1:9224/json/activate/${mk.id}`).catch(() => {});
await sleep(4500);
const ws = new WebSocket(mk.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
console.log('URL:', await c.evalT('location.href', 6000));
const dump = await c.evalT(`JSON.stringify((function(){
  function vis(e){ return e.offsetParent !== null; }
  var out = [];
  document.querySelectorAll('input,button,a[class*=btn],[role=button]').forEach(function(e){
    if(!vis(e)) return;
    var b = e.getBoundingClientRect();
    out.push({tag: e.tagName, type: e.type || '', txt: (e.innerText || e.placeholder || '').trim().slice(0, 30),
      href: e.tagName === 'A' ? (e.getAttribute('href') || '').slice(0, 50) : '',
      x: Math.round(b.x + b.width/2), y: Math.round(b.y + b.height/2)});
  });
  return out.slice(0, 20);
})())`, 8000);
console.log('DUMP:', dump);
const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/tt_login.png', Buffer.from(s.data, 'base64'));
console.log('tab=' + mk.id + ' SHOT ok');
process.exit(0);
