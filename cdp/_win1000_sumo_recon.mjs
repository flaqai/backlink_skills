import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id, { method: 'PUT' }).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
try {
  await cdp.send('Page.navigate', { url: 'https://sumodir.com/submit' });
  for (let i = 0; i < 20; i++) { const r = await cdp.evalT(`document.readyState`, 6000).catch(() => 'E'); if (r === 'complete') break; await sleep(2000); }
  await sleep(6000);
  const info = await cdp.evalT(`(() => {
    const fields = [...document.querySelectorAll('input,textarea,select')].map(e => (e.tagName + ':' + (e.name || e.id) + ':' + e.type)).filter(x => !/^:on/.test(x));
    return JSON.stringify({
      title: document.title,
      forms: document.forms.length,
      fields: fields.slice(0, 25),
      buttons: [...document.querySelectorAll('button,input[type=submit]')].map(b => b.textContent.trim() || b.value).filter(Boolean).slice(0, 8),
      head: document.body.innerText.slice(0, 400),
    });
  })()`, 10000);
  console.log(info.replace(/\n/g, ' | '));
  await cdp.send('Page.captureScreenshot').then(r => fs.writeFileSync('D:/Github/backlink_skills/_win1000_sumo.png', Buffer.from(r.data, 'base64')));
} catch (e) { console.log('ERR', e.message); }
process.exit(0);
