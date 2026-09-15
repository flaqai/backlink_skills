import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('strikingly.com'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
// 关聊天窗
await c.eval(`(function(){ const b=[...document.querySelectorAll('button')].find(x=>x.offsetParent&&/下一步|关闭|Close/i.test(x.innerText||'')); if(b){b.click();return 'closed';} return 'nf'; })()`);
await sleep(2000);
const st = await c.eval(`(function(){
  const t=document.body.innerText;
  const i=t.indexOf("Leo's Site");
  return JSON.stringify({around: i>=0? t.slice(i-30,i+120) : t.slice(0,400)});
})()`);
console.log(st);
process.exit(0);
