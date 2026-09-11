import { CDP, sleep } from './CDP.mjs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
await cdp.send('Page.navigate', { url: 'https://www.salespider.com/business-directories-free-online-ads?name=Dino%20Age&city=623' });
for (let i = 0; i < 15; i++) { const r = await cdp.evalT(`document.readyState`, 6000).catch(() => 'E'); if (r === 'complete') break; await sleep(2000); }
await sleep(3000);
console.log('URL:', await cdp.evalT(`location.href`, 6000));
console.log('TXT:', await cdp.evalT(`document.body.innerText.split('\n').slice(0,20).join(' | ').slice(0,500)`, 8000));
console.log('INPUTS:', await cdp.evalT(`JSON.stringify([...document.querySelectorAll('input')].map(function(i){return i.name||i.id}).slice(0,15))`, 6000));
await fetch('http://127.0.0.1:9224/json/close/' + t.id);
