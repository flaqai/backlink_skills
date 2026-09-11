import { CDP, sleep } from './CDP.mjs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://bestaibrands.com/?s=aitoolsdirectory.vip', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
for (let i = 0; i < 20; i++) { await sleep(2000); const r = await cdp.evalT(`document.readyState`, 5000).catch(() => 'E'); if (r === 'complete') break; }
await sleep(3000);
console.log('URL:', await cdp.evalT(`location.href`, 6000));
console.log('HITS:', await cdp.evalT(`String(document.body.innerText.split('aitoolsdirectory').length - 1)`, 6000));
console.log('LINKS:', await cdp.evalT(`JSON.stringify([...document.querySelectorAll('a')].map(function(a){return a.href}).filter(function(h){return /aitoolsdirectory|tool|product/i.test(h)}).slice(0,10))`, 8000));
console.log('TXT:', await cdp.evalT(`document.body.innerText.slice(0,400)`, 6000));
await fetch('http://127.0.0.1:9224/json/close/' + t.id);
