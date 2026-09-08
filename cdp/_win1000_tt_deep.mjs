import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id, { method: 'PUT' }).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
try {
  await cdp.send('Page.navigate', { url: 'https://testingtools.ai/submit-tool/' });
  for (let i = 0; i < 15; i++) { const r = await cdp.evalT(`document.readyState`, 6000).catch(() => 'E'); if (r === 'complete') break; await sleep(2000); }
  await sleep(4000);
  // 滚到底触发惰性渲染
  await cdp.eval(`window.scrollTo(0, document.body.scrollHeight)`);
  await sleep(4000);
  await cdp.eval(`window.scrollTo(0, document.body.scrollHeight / 2)`);
  await sleep(3000);
  const info = await cdp.evalT(`(() => {
    const ifr = [...document.querySelectorAll('iframe')].map(f => f.src.slice(0, 100));
    return JSON.stringify({
      forms: document.forms.length,
      fields: [...document.querySelectorAll('input:not([type=hidden]),textarea,select')].map(e => e.tagName + ':' + (e.name || e.id || e.placeholder || '(none)') + ':' + (e.type || '')).slice(0, 20),
      iframes: ifr,
      tail: document.body.innerText.slice(-600),
    });
  })()`, 10000);
  console.log(String(info).replace(/\n/g, ' | '));
  await cdp.send('Page.captureScreenshot').then(r => fs.writeFileSync('D:/Github/backlink_skills/_win1000_tt_deep.png', Buffer.from(r.data, 'base64')));
} catch (e) { console.log('ERR', e.message); }
process.exit(0);
