// _reg0000_daA.mjs — deviantart /join 渲染侦察 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /deviantart\.com/.test(t.url));
if (!tab) {
  tab = await (await fetch('http://127.0.0.1:9224/json/new?https://www.deviantart.com/join', {method:'PUT'})).json();
  await sleep(10000);
} else { await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{}); }
await sleep(1000);
const list2 = await (await fetch('http://127.0.0.1:9224/json/list')).json();
tab = list2.find(t => t.type === 'page' && /deviantart\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(6000)]);
const st = await Promise.race([c.evalT(`(() => {
  const fields = [...document.querySelectorAll('input,button')].filter(e=>e.offsetParent).slice(0,15).map(e=>({tag:e.tagName, type:e.type||'', name:e.name||'', id:e.id||'', ph:e.placeholder||'', txt:(e.innerText||'').trim().slice(0,20)}));
  return JSON.stringify({url: location.href.slice(0,90), fields, body: (document.body.innerText||'').replace(/\s+/g,' ').slice(0,200)});
})()`, 12000), sleep(13000).then(()=>'TO')]);
console.log(typeof st === 'string' ? st : 'TO');
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(8000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_da.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
