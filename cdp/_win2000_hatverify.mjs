import { CDP, sleep } from './CDP.mjs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent('https://leoxmnotes.hatenablog.com/entry/2026/09/02/214048'), { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(9000);
console.log(await c.eval(`(() => JSON.stringify({ title: document.title.slice(0,70), zk: document.documentElement.innerHTML.includes('qrcodegenerator'), entryLinks: [...document.querySelectorAll('.entry-content a[href]')].map(a => a.href).filter(h => h.includes('qrcodegenerator')).slice(0,2) }))()`));
await fetch('http://127.0.0.1:9224/json/close/' + t.id);
