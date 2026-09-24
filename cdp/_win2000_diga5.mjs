import { CDP, sleep } from './CDP.mjs';
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.find(t => (t.url || '').includes('digabusiness') && t.type === 'page');
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
const d = await cdp.eval(`(() => {
  const items = [...document.querySelectorAll('#categtree .categ-item')];
  return JSON.stringify(items.map(x => ({oc: (x.getAttribute('onclick')||'').slice(0,40), t: x.textContent.trim().slice(0,40)})));
})()`);
for (const it of JSON.parse(d)) console.log(it.oc, '||', it.t);
process.exit(0);
