import { CDP, sleep } from './CDP.mjs';
let tab = await (await fetch('http://127.0.0.1:9224/json/new?https://www.publish0x.com/register', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(12000);
const st = await c.eval(`(function(){
  const inputs=[...document.querySelectorAll('input')].filter(i=>i.offsetParent).map(i=>({t:i.type,n:i.name,ph:i.placeholder}));
  return JSON.stringify({url:location.href.slice(0,90), title:document.title, inputs:inputs.slice(0,8)});
})()`);
console.log(st);
process.exit(0);
