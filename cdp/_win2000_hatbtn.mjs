import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes('edit?entry=1494577603207'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
console.log(await c.eval(`(() => JSON.stringify([...document.querySelectorAll('button, input[type=submit], input[type=button], a.button')].filter(e => e.offsetWidth > 0).map(e => ({ t: (e.textContent||e.value||'').trim().slice(0,25), id: e.id, cls: (e.className||'').toString().slice(0,30) })).slice(0, 20), null, 1))()`));
