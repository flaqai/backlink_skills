import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://hackernoon.com/', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
for (let i = 0; i < 12; i++) { await sleep(2000); const r = await cdp.evalT(`document.readyState`, 5000).catch(() => 'E'); if (r === 'complete') break; }
const token = await cdp.evalT(`fetch('https://bridge.hackernoon.com/auth/postauth', {method:'POST', credentials:'include'}).then(r=>r.json()).then(j=>j.token).catch(e=>'ERR:'+e.message)`, 15000);
if (String(token).startsWith('ERR')) { console.log(token); process.exit(1); }
fs.writeFileSync('D:/Github/backlink_skills/cdp/_w1200/hn_token.txt', String(token));
console.log('TOKEN_LEN:', String(token).length);
await fetch('http://127.0.0.1:9224/json/close/' + t.id);
