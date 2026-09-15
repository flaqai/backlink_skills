import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

// reg0000d2: 干净 JSON via iframe
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())]
  .find(t => t.type === 'page' && /dreamwidth\.org/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const cleanJson = `(function(){
  var f = document.createElement('iframe');
  f.style.display='none'; document.body.appendChild(f);
  var J = f.contentWindow.JSON;
  var res = {inputs: [], buttons: [], url: location.href};
  document.querySelectorAll('input,textarea,select').forEach(function(e){
    if(e.offsetParent === null) return;
    var b = e.getBoundingClientRect();
    res.inputs.push({name: e.name || e.id || e.type, tag: e.tagName, x: Math.round(b.x+b.width/2), y: Math.round(b.y+b.height/2)});
  });
  document.querySelectorAll('button,input[type=submit]').forEach(function(e){
    if(e.offsetParent === null) return;
    var b = e.getBoundingClientRect();
    res.buttons.push({v: (e.innerText||e.value||'').slice(0,25), x: Math.round(b.x+b.width/2), y: Math.round(b.y+b.height/2)});
  });
  var s = J.stringify(res); f.remove(); return s;
})()`;
console.log('FORM:', await c.evalT(cleanJson, 8000));
const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/dw_update.png', Buffer.from(s.data, 'base64'));
console.log('SHOT ok');
process.exit(0);
