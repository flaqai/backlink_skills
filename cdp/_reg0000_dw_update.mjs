import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

// reg0000d: 探发文路径 /update
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())]
  .find(t => t.type === 'page' && /dreamwidth\.org/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
await c.send('Page.navigate', { url: 'https://www.dreamwidth.org/update' });
await sleep(5000);
console.log('URL:', await c.evalT('location.href', 8000));
console.log('FORM:', await c.evalT(`JSON.stringify((function(){
  var out = {inputs: [], buttons: []};
  document.querySelectorAll('input,textarea,select').forEach(function(e){
    if(e.offsetParent === null) return;
    var b = e.getBoundingClientRect();
    out.inputs.push({name: e.name || e.id || e.type, tag: e.tagName, ph: (e.placeholder||'').slice(0,30), x: Math.round(b.x+b.width/2), y: Math.round(b.y+b.height/2)});
  });
  document.querySelectorAll('button,input[type=submit]').forEach(function(e){
    if(e.offsetParent === null) return;
    var b = e.getBoundingClientRect();
    out.buttons.push({v: (e.innerText||e.value||'').slice(0,25), x: Math.round(b.x+b.width/2), y: Math.round(b.y+b.height/2)});
  });
  return out;
})())`, 8000));
const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/dw_update.png', Buffer.from(s.data, 'base64'));
console.log('SHOT ok');
process.exit(0);
