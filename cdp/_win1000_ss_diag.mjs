import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id, { method: 'PUT' }).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
try {
  await cdp.send('Page.navigate', { url: 'https://www.salespider.com/business-directories-free-online-ads?name=Dino%20Age&city=623' });
  for (let i = 0; i < 20; i++) { const r = await cdp.evalT(`document.readyState`, 6000).catch(() => 'E'); if (r === 'complete') break; await sleep(2000); }
  await sleep(4000);
  console.log('URL:', await cdp.evalT(`location.href`, 6000));
  console.log('TITLE:', await cdp.evalT(`document.title`, 6000));
  console.log('HASLOGIN:', String(await cdp.evalT(`JSON.stringify({loginForm: !!document.querySelector('input[name=email],input[type=email]'), co: !!document.querySelector('input[name=businessdirectory_companyName]'), head: document.body.innerText.slice(0,300)})`, 8000)).replace(/\n+/g,' | '));
  await cdp.send('Page.captureScreenshot').then(r => fs.writeFileSync('D:/Github/backlink_skills/_win1000_ss_diag.png', Buffer.from(r.data, 'base64')));
} catch (e) { console.log('ERR', e.message); }
process.exit(0);
