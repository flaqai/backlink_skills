// _reg0000_ukitA.mjs — ukit 登录态检查+站点列表 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /ukit\.com/.test(t.url));
if (!tab) {
  tab = await (await fetch('http://127.0.0.1:9224/json/new?https://ukit.com/sites',{method:'PUT'})).json();
  await sleep(6000);
} else {
  await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
  const ws0 = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(r=>{ws0.onopen=r;setTimeout(r,5000)});
  const c0 = new CDP(ws0);
  await c0.send('Page.enable');
  await c0.send('Page.navigate', {url:'https://ukit.com/sites'});
  ws0.close();
  await sleep(6000);
}
const list2 = await (await fetch('http://127.0.0.1:9224/json/list')).json();
tab = list2.find(t => t.type === 'page' && /ukit\.com/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable');
const info = await c.evalT(`(() => {
  return JSON.stringify({
    url: location.href.slice(0,120),
    title: document.title.slice(0,80),
    bodyText: document.body.innerText.replace(/\s+/g,' ').slice(0,500)
  });
})()`, 12000);
console.log(typeof info === 'string' && info !== 'TIMEOUT' ? info : 'TIMEOUT');
ws.close();
