// _reg0000_ukitD.mjs — ukit 画布文本块DOM结构侦察 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /constructor/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable');
const dom = await c.evalT(`(() => {
  const hits = [];
  const walk = (doc, depth) => {
    if (depth > 4) return;
    for (const el of doc.querySelectorAll('div,p,h1,h2,h3,span,section')) {
      const t = (el.childNodes.length && [...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('')) || '';
      if (/nurseries|Indoor flowers| Bringing the right|house plants/i.test(t) && el.children.length < 6) {
        hits.push({tag: el.tagName, cls: el.className.toString().slice(0,60), editable: el.isContentEditable, len: t.length, preview: t.replace(/\s+/g,' ').slice(0,50)});
      }
    }
    for (const f of doc.querySelectorAll('iframe')) { try { walk(f.contentDocument, depth+1); } catch(e){} }
    if (doc !== document) return;
    // shadow roots
    for (const el of doc.querySelectorAll('*')) { if (el.shadowRoot) walk(el.shadowRoot, depth+1); }
  };
  walk(document, 0);
  return JSON.stringify({count: hits.length, hits: hits.slice(0,10)});
})()`, 12000);
console.log(typeof dom === 'string' ? dom : 'TIMEOUT');
ws.close();
