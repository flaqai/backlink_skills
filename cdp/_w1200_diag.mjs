import { CDP, sleep } from './CDP.mjs';
const dom = process.argv[2];
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://' + dom + '/new-post', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
for (let i = 0; i < 10; i++) { await sleep(2000); const r = await cdp.evalT(`document.readyState`, 5000).catch(() => 'E'); if (r === 'complete') break; }
await sleep(2000);
console.log('URL:', await cdp.evalT(`location.href`, 6000));
console.log('HAS_TITLE:', await cdp.evalT(`String(!!document.querySelector('#title'))`, 5000));
console.log('TXT:', await cdp.evalT(`document.body.innerText.slice(0,250)`, 6000));
await fetch('http://127.0.0.1:9224/json/close/' + t.id);
