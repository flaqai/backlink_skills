import { CDP, sleep } from './CDP.mjs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://hackernoon.com/', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
for (let i = 0; i < 15; i++) { await sleep(2000); const r = await cdp.evalT(`document.readyState`, 5000).catch(() => 'E'); if (r === 'complete') break; }
console.log('URL:', await cdp.evalT(`location.href`, 6000));
console.log('LOGGEDIN:', await cdp.evalT(`String(document.body.innerText.includes('Log in')===false)`, 6000));
const auth = await cdp.evalT(`fetch('https://bridge.hackernoon.com/auth/postauth', {method:'POST', credentials:'include'}).then(r=>r.text()).then(x=>x.slice(0,400)).catch(e=>'ERR:'+e.message)`, 15000);
console.log('POSTAUTH:', auth);
await fetch('http://127.0.0.1:9224/json/close/' + t.id);
