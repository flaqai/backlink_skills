// _reg0000_daV.mjs — 查Posts页journal是否发布 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && /deviantart\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(5000)]);
await Promise.race([c.send('Page.navigate', {url: 'https://www.deviantart.com/leoxm26/posts'}), sleep(8000).then(()=>'TO')]);
await sleep(7000);
const st = await Promise.race([c.evalT(`(() => JSON.stringify({url: location.href.slice(0,100), body: (document.body.innerText||'').replace(/\s+/g,' ').slice(0,600)}))()`, 10000), sleep(11000).then(()=>'TO')]);
console.log(typeof st === 'string' ? st : 'TO');
ws.close();
