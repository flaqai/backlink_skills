import { CDP, sleep } from './CDP.mjs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /dreamwidth\.org/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
console.log('URL:', await c.evalT('location.href', 8000));
// 变量名 out 撞了页面里的全局 out —— 换名
console.log('FORM:', await c.evalT(`JSON.stringify((function(){
  var res = {inputs: [], buttons: []};
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
  return res;
})())`, 8000));
process.exit(0);
