import { CDP, sleep } from './CDP.mjs';
const dom = process.argv[2];
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://' + dom + '/new-post', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
for (let i = 0; i < 12; i++) { await sleep(2000); const r = await cdp.evalT(`document.readyState`, 5000).catch(() => 'E'); if (r === 'complete') break; }
console.log('URL:', await cdp.evalT(`location.href`, 6000));
console.log('NAVLINKS:', await cdp.evalT(`JSON.stringify([...document.querySelectorAll('a')].map(function(a){return a.textContent.trim()+'|'+a.href}).filter(function(s){return /profile|account|dashboard|admin|settings|author/i.test(s)}).slice(0,8))`, 8000));
await fetch('http://127.0.0.1:9224/json/close/' + t.id);
