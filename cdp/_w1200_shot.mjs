import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const [url, outfile] = process.argv.slice(2);
const t = await (await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent(url), { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
for (let i = 0; i < 20; i++) { await sleep(2000); const r = await cdp.evalT(`document.readyState`, 5000).catch(() => 'E'); if (r === 'complete') break; }
await sleep(4000);
const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
fs.writeFileSync(outfile, Buffer.from(shot.data, 'base64'));
console.log('SAVED', outfile, fs.statSync(outfile).size, 'bytes |', await cdp.evalT(`location.href`, 5000));
await fetch('http://127.0.0.1:9224/json/close/' + t.id);
