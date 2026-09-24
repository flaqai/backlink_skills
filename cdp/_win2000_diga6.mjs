import { CDP, sleep } from './CDP.mjs';
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.find(t => (t.url || '').includes('digabusiness') && t.type === 'page');
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
await cdp.eval(`update_categ_selection(13, 0, 1); 'called'`);
await sleep(2500);
const d = await cdp.eval(`(() => {
  const items = [...document.querySelectorAll('#categtree .categ-item')];
  return JSON.stringify(items.map(x => ({oc: (x.getAttribute('onclick')||'').replace(/[^0-9,() ]/g,'').slice(0,20), t: x.textContent.trim().slice(0,42)})));
})()`);
for (const it of JSON.parse(d)) console.log(it.oc, '||', it.t);
process.exit(0);
