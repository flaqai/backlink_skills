// _reg0000_daZ.mjs — 查DA Studio草稿 (reg0000)
import { CDP, sleep } from './CDP.mjs';
let tab = await (await fetch('http://127.0.0.1:9224/json/new?https://www.deviantart.com/studio', {method:'PUT'})).json();
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(11000);
const list2 = await (await fetch('http://127.0.0.1:9224/json/list')).json();
tab = list2.find(t => t.type === 'page' && /deviantart\.com/.test(t.url));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(5000)]);
const st = await Promise.race([c.evalT(`(() => JSON.stringify({url: location.href.slice(0,90), title: document.title.slice(0,40), body: (document.body.innerText||'').replace(/\s+/g,' ').slice(0,400)}))()`, 10000), sleep(11000).then(()=>'TO')]);
console.log(typeof st === 'string' ? st : 'TO');
ws.close();
