import { CDP, sleep } from './CDP.mjs';
let tab = await (await fetch('http://127.0.0.1:9224/json/new?https://www.strikingly.com/s#', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(9000);
const st = await c.eval(`(function(){
  const t=document.body.innerText;
  const pub=t.includes('未发布')? '未发布' : (t.includes('已发布')? '已发布' : '?');
  return JSON.stringify({pub, ctx:t.slice(0,300)});
})()`);
console.log(st);
process.exit(0);
