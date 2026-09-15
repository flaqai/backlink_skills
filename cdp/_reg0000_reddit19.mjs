// _reg0000_reddit19.mjs — 取帖子URL (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /reddit\.com/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(800);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(6000)]);
const r = await Promise.race([c.evalT(`(() => {
  const find = (root, depth, out) => {
    if (depth > 6) return out;
    for (const a of root.querySelectorAll('a[href*="/comments/"]')) { const t = a.getAttribute('href'); if (out.indexOf(t) < 0) out.push(t); }
    for (const el of root.querySelectorAll('*')) { if (el.shadowRoot) find(el.shadowRoot, depth+1, out); }
    return out;
  };
  return JSON.stringify(find(document, 0, []).slice(0,3));
})()`, 10000), sleep(11000).then(()=>'TO')]);
console.log('POST_URLS:', typeof r === 'string' ? r : 'TO');
ws.close();
