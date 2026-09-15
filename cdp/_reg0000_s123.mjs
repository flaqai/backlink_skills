import { CDP, sleep } from './CDP.mjs';
let tab = await (await fetch('http://127.0.0.1:9224/json/new?https://www.site123.com/signup', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(9000);
const st = await c.eval(`(function(){
  const inputs=[...document.querySelectorAll('input,select,button')].filter(i=>i.offsetParent).map(i=>({t:i.type||i.tagName,n:i.name||'',ph:i.placeholder||'',txt:(i.innerText||'').trim().slice(0,20)}));
  return JSON.stringify({url:location.href.slice(0,90), inputs:inputs.slice(0,14)});
})()`);
console.log(st);
process.exit(0);
