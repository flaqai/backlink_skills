import { CDP } from './CDP.mjs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('thezenweb'));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const c = new CDP(ws);
await c.send('Page.enable');
console.log(await c.eval(`JSON.stringify({url:location.href, head:document.body.innerText.replace(/\s+/g,' ').slice(0,200)})`));
process.exit(0);
