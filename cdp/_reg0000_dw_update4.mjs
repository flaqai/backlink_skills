import { CDP } from './CDP.mjs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /dreamwidth\.org/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
console.log('FORM:', await c.evalT(`(function(){
  var lines = [];
  document.querySelectorAll('input,textarea,select').forEach(function(e){
    if(e.offsetParent === null) return;
    var b = e.getBoundingClientRect();
    lines.push([e.tagName, e.name || e.id || e.type, Math.round(b.x+b.width/2), Math.round(b.y+b.height/2)].join('|'));
  });
  document.querySelectorAll('button,input[type=submit]').forEach(function(e){
    if(e.offsetParent === null) return;
    var b = e.getBoundingClientRect();
    lines.push(['BTN', (e.innerText||e.value||'').slice(0,25), Math.round(b.x+b.width/2), Math.round(b.y+b.height/2)].join('|'));
  });
  return lines.join(' ; ');
})()`, 8000));
process.exit(0);
