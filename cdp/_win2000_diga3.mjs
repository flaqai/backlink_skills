import { CDP, sleep } from './CDP.mjs';
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.find(t => (t.url || '').includes('digabusiness') && t.type === 'page');
if (!tab) { console.log('NOTAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
const d = await cdp.eval(`(() => {
  const box = document.getElementById('categtreebox');
  return 'len=' + (box ? box.innerHTML.length : -1) + ' | ' + (box ? box.innerHTML.replace(/\s+/g,' ').slice(0, 500) : '');
})()`);
console.log(d);
process.exit(0);
