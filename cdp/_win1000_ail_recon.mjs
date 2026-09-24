import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id, { method: 'PUT' }).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
try {
  await cdp.send('Page.navigate', { url: 'https://ailistingtool.com/submit-a-tool' });
  for (let i = 0; i < 15; i++) { const r = await cdp.evalT(`document.readyState`, 6000).catch(() => 'E'); if (r === 'complete') break; await sleep(2000); }
  await sleep(5000);
  const info = await cdp.evalT(`(() => JSON.stringify({
    title: document.title,
    forms: document.forms.length,
    action: document.querySelector('form')?.action?.slice(0, 80),
    fields: [...document.querySelectorAll('input,textarea,select')].map(e => e.tagName + ':' + (e.name || e.id || '(none)') + ':' + (e.type || '') + (e.required ? '*' : '')).slice(0, 25),
    buttons: [...document.querySelectorAll('button,input[type=submit]')].map(b => (b.textContent || b.value || '').trim()).filter(Boolean).slice(0, 6),
    paid: /price|paid|premium|\$/i.test(document.body.innerText.slice(0, 3000)),
    head: document.body.innerText.slice(0, 250),
  }))()`, 10000);
  console.log(String(info).replace(/\n/g, ' | '));
  await cdp.send('Page.captureScreenshot').then(r => fs.writeFileSync('D:/Github/backlink_skills/_win1000_ail.png', Buffer.from(r.data, 'base64')));
} catch (e) { console.log('ERR', e.message); }
process.exit(0);
