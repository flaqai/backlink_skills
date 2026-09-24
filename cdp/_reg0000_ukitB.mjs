// _reg0000_ukitB.mjs — ukit 找Edit/Blog入口并进编辑器 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /ukit\.com/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable');
const links = await c.evalT(`(() => {
  const els = [...document.querySelectorAll('a,button')].filter(el=>el.offsetWidth && /edit|blog|publish/i.test(el.innerText+' '+el.className)).slice(0,12).map(el=>[el.tagName,(el.getAttribute('href')||'').slice(0,90),el.innerText.trim().slice(0,25)]);
  return JSON.stringify(els);
})()`, 9000);
console.log('LINKS:', typeof links === 'string' ? links : 'TIMEOUT');
// 点 Edit 进编辑器
const clicked = await c.evalT(`(() => {
  const el = [...document.querySelectorAll('a,button')].find(el=>el.offsetWidth && /^edit$/i.test(el.innerText.trim()));
  if (el) { el.click(); return 'clicked:'+el.tagName; }
  return 'no-edit-btn';
})()`, 8000);
console.log('CLICK:', clicked);
await sleep(9000);
const info = await c.evalT(`(() => JSON.stringify({url:location.href.slice(0,140), title:document.title.slice(0,60), txt:document.body.innerText.replace(/\s+/g,' ').slice(0,300)}))()`, 12000);
console.log('AFTER:', typeof info === 'string' ? info : 'TIMEOUT');
ws.close();
