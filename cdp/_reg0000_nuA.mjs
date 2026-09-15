// _reg0000_nuA.mjs — inube 最后一轮: 注册页+填表+点码 (reg0000)
import { CDP, sleep } from './CDP.mjs';
let tab = await (await fetch('http://127.0.0.1:9224/json/new?https://www.inube.com/register/', {method:'PUT'})).json();
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(9000);
const list2 = await (await fetch('http://127.0.0.1:9224/json/list')).json();
tab = list2.find(t => t.type === 'page' && /inube\.com/.test(t.url));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(5000)]);
const st = await Promise.race([c.evalT(`(() => {
  const f = [...document.querySelectorAll('input')].filter(i=>i.offsetParent).map(i=>({name:i.name,type:i.type,id:i.id}));
  return JSON.stringify({url: location.href.slice(0,80), fields: f.slice(0,8)});
})()`, 10000), sleep(11000).then(()=>'TO')]);
console.log('REG:', typeof st === 'string' ? st : 'TO');
ws.close();
