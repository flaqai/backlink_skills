import { CDP, sleep } from './CDP.mjs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://hackernoon.com/', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
for (let i = 0; i < 15; i++) { await sleep(2000); const r = await cdp.evalT(`document.readyState`, 5000).catch(() => 'E'); if (r === 'complete') break; }
const res = await cdp.evalT(`fetch('https://bridge.hackernoon.com/auth/postauth', {method:'POST', credentials:'include'}).then(r=>r.json()).then(async j => {
  const r2 = await fetch('https://firestore.googleapis.com/v1/projects/hackernoon-app/databases/(default)/documents/drafts/6a9d7bb2b31525fcd809251a', {headers:{Authorization:'Bearer '+j.token}});
  const txt = await r2.text();
  return 'STATUS:'+r2.status+' BODY:'+txt.slice(0, 1500);
}).catch(e=>'ERR:'+e.message)`, 25000);
console.log(res);
await fetch('http://127.0.0.1:9224/json/close/' + t.id);
