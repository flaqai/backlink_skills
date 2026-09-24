import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = await (await fetch('http://127.0.0.1:9224/json/new?https://write.as/', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(10000);
const st = await c.eval(`(function(){
  return JSON.stringify({url:location.href.slice(0,80), title:document.title, txt:document.body.innerText.slice(0,200)});
})()`);
console.log(st);
process.exit(0);
