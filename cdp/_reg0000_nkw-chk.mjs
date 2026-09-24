import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const page = list.find(t => t.type === 'page' && /nekoweb\.org/.test(t.url));
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable');
const tree = await c.eval(`(async () => { const r = await fetch('/api/files/readfolder?pathname=/leoxm.nekoweb.org', {credentials:'same-origin'}); const j = await r.json(); return JSON.stringify((j.items||j).map(x=>x.name||x.pathname||x)); })()`);
console.log('TREE:', tree);
