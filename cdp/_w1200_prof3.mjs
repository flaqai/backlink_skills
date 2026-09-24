import { CDP, sleep } from './CDP.mjs';
const dom = process.argv[2];
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://' + dom + '/my-profile', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
for (let i = 0; i < 15; i++) { await sleep(2000); const r = await cdp.evalT(`document.readyState`, 5000).catch(() => 'E'); if (r === 'complete') break; }
await sleep(3000);
console.log('URL:', await cdp.evalT(`location.href`, 6000));
console.log('FIELDS:', await cdp.evalT(`JSON.stringify({inputs:[...document.querySelectorAll('input,textarea,select')].map(function(i){return (i.name||i.id||'noname')+':'+i.type}).slice(0,16), txt:document.body.innerText.slice(0,200)})`, 10000));
await fetch('http://127.0.0.1:9224/json/close/' + t.id);
