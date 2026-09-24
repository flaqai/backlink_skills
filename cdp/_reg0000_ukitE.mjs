// _reg0000_ukitE.mjs — ukit 主文本块真实内容核对 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /constructor/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable');
const info = await c.evalT(`(() => {
  const spans = [...document.querySelectorAll('span')].filter(el=>el.isContentEditable && el.textContent.length > 400);
  const s = spans[0];
  if (!s) return 'notfound';
  const t = s.textContent;
  return JSON.stringify({len: t.length, hasNormalS: t.includes('s'), head: t.slice(0,120), codes: [...t.slice(0,30)].map(ch=>ch.codePointAt(0))});
})()`, 10000);
console.log(typeof info === 'string' ? info : 'TIMEOUT');
ws.close();
