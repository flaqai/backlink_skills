// win1000 sumodir Step2: 填URL→下一步→盘详情字段
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id, { method: 'PUT' }).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
cdp.on(m => { if (m.method === 'Page.javascriptDialogOpening') { console.log('DIALOG:', m.params.message); cdp.send('Page.handleJavaScriptDialog', { accept: true }).catch(()=>{}); } });
async function realType(sel, text) {
  const ok = await cdp.eval(`(() => { const e = document.querySelector('${sel}'); if (!e) return 'NOEL'; e.scrollIntoView({block:'center'}); e.focus(); e.value=''; return 'OK'; })()`);
  if (ok !== 'OK') return 'NOEL';
  for (const ch of text) {
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', text: ch, unmodifiedText: ch });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', text: ch, unmodifiedText: ch });
    await sleep(35);
  }
  await sleep(300);
  return await cdp.eval(`document.querySelector('${sel}')?.value`);
}
try {
  await cdp.send('Page.navigate', { url: 'https://sumodir.com/submit' });
  for (let i = 0; i < 20; i++) { const r = await cdp.evalT(`document.readyState`, 6000).catch(() => 'E'); if (r === 'complete') break; await sleep(2000); }
  await sleep(5000);
  const c1 = await cdp.evalT(`(() => { const b = [...document.querySelectorAll('button,a,div')].find(x => /^Select Free Listing$/i.test((x.textContent || '').trim())); if (!b) return null; b.scrollIntoView({block:'center'}); const r = b.getBoundingClientRect(); return JSON.stringify({x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2)}); })()`, 10000);
  if (c1) { const q = JSON.parse(c1); for (const ty of ['mousePressed','mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type: ty, x: q.x, y: q.y, button: 'left', clickCount: 1 }); }
  await sleep(4000);
  console.log('TYPE:', await realType('input[name=verify-url], #verify-url', 'https://crazyshark.org/'));
  // 找 Continue/Next/Verify 钮
  const nb = await cdp.evalT(`(() => { const b = [...document.querySelectorAll('button,a')].find(x => /^(continue|next|verify|submit)$/i.test((x.textContent || '').trim())); if (!b) return null; b.scrollIntoView({block:'center'}); const r = b.getBoundingClientRect(); return JSON.stringify({x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), txt: (b.textContent || '').trim().slice(0, 20)}); })()`, 10000);
  console.log('NEXT-BTN:', nb);
  if (nb) { const q = JSON.parse(nb); for (const ty of ['mousePressed','mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type: ty, x: q.x, y: q.y, button: 'left', clickCount: 1 }); }
  await sleep(8000);
  const f3 = await cdp.evalT(`(() => {
    const fields = [...document.querySelectorAll('input:not([type=hidden]),textarea,select')].map(e => e.tagName + ':' + (e.name || e.id || '(none)') + ':' + (e.type || ''));
    return JSON.stringify({ fields: fields.slice(0, 25), body: document.body.innerText.slice(0, 500) });
  })()`, 10000);
  console.log(String(f3).replace(/\n/g, ' | '));
  await cdp.send('Page.captureScreenshot').then(r => fs.writeFileSync('D:/Github/backlink_skills/_win1000_sumo_s3.png', Buffer.from(r.data, 'base64')));
} catch (e) { console.log('ERR', e.message); }
process.exit(0);
