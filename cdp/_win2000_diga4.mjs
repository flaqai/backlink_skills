import { CDP, sleep } from './CDP.mjs';
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.find(t => (t.url || '').includes('digabusiness') && t.type === 'page');
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
const d = await cdp.eval(`(() => {
  const items = [...document.querySelectorAll('#categtree .categ-item')];
  return JSON.stringify(items.map(x => {
    const m = (x.getAttribute('onclick')||'').match(/\((\d+),\s*(\d+),\s*(\d+)\)/);
    return {id: m ? m[1] : '?', leaf: m ? m[3] : '?', t: x.textContent.trim().slice(0, 45)};
  }));
})()`);
const arr = JSON.parse(d);
console.log('total', arr.length);
for (const it of arr) if (/(internet|comput|busines|director|shop|educat)/i.test(it.t)) console.log(it.id, it.leaf, it.t);
process.exit(0);
