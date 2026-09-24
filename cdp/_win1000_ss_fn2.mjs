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
  for (let i = 0; i < 15; i++) { const r = await cdp.evalT(`document.readyState`, 6000).catch(() => 'E'); if (r === 'complete') break; await sleep(2000); }
  await sleep(3000);
  const src = String(await cdp.evalT(`window.businessdirectory_post.toString()`, 10000));
  fs.writeFileSync('D:/Github/backlink_skills/tmp_recon/win1000_ss_postfn.js', src);
  console.log('POSTLEN:', src.length);
  // 提交钮的 onclick 原文(实参!)
  console.log('ONCLICK:', String(await cdp.evalT(`(() => { const d = [...document.querySelectorAll('div,input')].find(x => /businessdirectory_post/.test(x.getAttribute('onclick') || '')); return d ? d.getAttribute('onclick') : 'NOBTN'; })()`, 8000)));
  console.log('CONSENT:', String(await cdp.evalT(`JSON.stringify({has: !!document.querySelector('#businessdirectory_consent'), checked: document.querySelector('#businessdirectory_consent')?.checked})`, 8000)));
} catch (e) { console.log('ERR', e.message); }
process.exit(0);
