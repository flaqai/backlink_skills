import { CDP, sleep } from './CDP.mjs';
const domain = process.argv[2];
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.find(t => (t.url || '').includes(domain) && t.type === 'page');
if (!tab) { console.log('NOTAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
const t = await cdp.evalT(`document.body.innerText.replace(/\s+/g,' ').slice(0,400)`, 8000);
console.log('PAGE:', t);
process.exit(0);
