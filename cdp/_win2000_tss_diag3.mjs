import { CDP, sleep } from './CDP.mjs';
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = tabs.find(t => (t.url || '').includes('topsimilarsites') && t.type === 'page');
if (!tab) { console.log('no tab (closed)'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id, { method: 'PUT' }).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
const info = await cdp.eval(`(() => {
  const out = {refresh: typeof refreshSite === 'function' ? refreshSite.toString().slice(0, 500) : 'UNDEFINED', url: location.href};
  return JSON.stringify(out, null, 1);
})()`);
console.log(info);
process.exit(0);
