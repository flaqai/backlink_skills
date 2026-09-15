// _reg0000_daN.mjs — 关僵tab+全新tab走journal (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
for (const t of list.filter(t => t.type === 'page' && /deviantart\.com/.test(t.url))) {
  await fetch('http://127.0.0.1:9224/json/close/' + t.id).catch(()=>{});
  console.log('closed', t.url.slice(0,50));
}
await sleep(2000);
let tab = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', {method:'PUT'})).json();
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(1500);
const list2 = await (await fetch('http://127.0.0.1:9224/json/list')).json();
tab = list2.find(t => t.id === tab.id) || tab;
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(5000)]);
console.log('nav:', await Promise.race([c.send('Page.navigate', {url: 'https://www.deviantart.com/journal/post'}).then(r=>'ok'), sleep(9000).then(()=>'navTO')]));
await sleep(12000);
const st = await Promise.race([c.evalT(`(() => JSON.stringify({url: location.href.slice(0,110), title: document.title.slice(0,40), body: (document.body.innerText||'').replace(/\s+/g,' ').slice(0,200), ed: [...document.querySelectorAll('[contenteditable=true],textarea')].filter(e=>e.offsetParent).map(e=>({tag:e.tagName,ce:e.isContentEditable,ph:e.placeholder||'',aid:e.getAttribute('aria-label')||''})).slice(0,8)}))()`, 10000), sleep(11000).then(()=>'evalTO')]);
console.log(typeof st === 'string' ? st : 'TO2');
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(8000).then(()=>'TO3')]);
if (shot && shot !== 'TO3') (await import('fs')).writeFileSync('_reg0000_daN.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
