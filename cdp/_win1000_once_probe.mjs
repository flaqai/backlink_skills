// 选择器探针: 对比 name$= 与 name^= 命中
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id, { method: 'PUT' }).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
try {
  await cdp.send('Page.navigate', { url: 'https://once.tools/submit' });
  for (let i = 0; i < 15; i++) { const r = await cdp.evalT(`document.readyState`, 6000).catch(() => 'E'); if (r === 'complete') break; await sleep(2000); }
  await sleep(8000);
  const names = await cdp.eval(`JSON.stringify([...document.querySelectorAll('input,textarea')].map(e => e.name))`);
  console.log('NAMES:', names);
  const r1 = await cdp.eval(`(() => JSON.stringify({
    suffix: !!document.querySelector('input[name$="submitter_name"]'),
    prefix: !!document.querySelector('input[name^="mary"]'),
    inputCount: document.querySelectorAll('input').length,
    formCount: document.forms.length,
    inMain: Array.from(document.querySelectorAll('input')).some(e => (e.name || '').endsWith('submitter_name')),
  }))()`);
  console.log('PROBE:', r1);
  // 模拟 realType 内层构造
  const sel = 'input[name$="submitter_name"]';
  const r2 = await cdp.eval(`(() => { const e = document.querySelector('${sel}'); if (!e) return 'NOEL'; e.scrollIntoView({block:'center'}); e.focus(); return 'OK'; })()`);
  console.log('REALTYPE-SIM:', r2);
  await cdp.send('Page.captureScreenshot').then(r => fs.writeFileSync('D:/Github/backlink_skills/_win1000_once_probe.png', Buffer.from(r.data, 'base64')));
} catch (e) { console.log('ERR', e.message); }
process.exit(0);
