// win1000 once.tools 真提交: crazyshark.org (t8)
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
    await sleep(25);
  }
  await sleep(200);
  return await cdp.eval(`document.querySelector('${sel}')?.value?.slice(0, 25)`);
}
try {
  await cdp.send('Page.navigate', { url: 'https://once.tools/submit' });
  for (let i = 0; i < 15; i++) { const r = await cdp.evalT(`document.readyState`, 6000).catch(() => 'E'); if (r === 'complete') break; await sleep(2000); }
  await sleep(9000);
  await cdp.eval(`window.scrollTo(0, document.body.scrollHeight / 2)`);
  await sleep(3000);
  console.log("DUMP-NAMES:", await cdp.evalT(`JSON.stringify([...document.querySelectorAll("input,textarea")].map(e => e.name || e.id).slice(0, 12))`, 10000));
  console.log('name:', await realType('input[name$="submitter_name"]', 'Leo Xm'));
  console.log('email:', await realType('input[name$="submitter_email"]', 'once.shark@92ng.com'));
  console.log('tool:', await realType('input[name$="_name"]:not([name*="submitter"]):not([name*="description"])', 'Crazy Shark'));
  console.log('url:', await realType('input[name$="url"]', 'https://crazyshark.org/'));
  console.log('tag:', await realType('input[name$="short_description"]', 'Free shark attack browser game with fast-paced arcade action.'));
  console.log('desc:', await realType('textarea[name$="description"]', 'Play Crazy Shark, a free shark attack browser game. Fast-paced arcade survival action with quick matches, no downloads, instant fun.'));
  console.log('price:', await realType('input[name$="price_display"]', 'Free'));
  await cdp.send('Page.captureScreenshot').then(r => fs.writeFileSync('D:/Github/backlink_skills/_win1000_once_filled.png', Buffer.from(r.data, 'base64')));
  // 找提交钮
  const sb = await cdp.evalT(`(() => { const b = [...document.querySelectorAll('button,input[type=submit]')].find(x => /submit|send/i.test((x.textContent || x.value || '')) && !/preview/i.test(x.textContent || '')); if (!b) return null; b.scrollIntoView({block:'center'}); const r = b.getBoundingClientRect(); return JSON.stringify({x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), txt: (b.textContent || b.value || '').trim().slice(0, 30)}); })()`, 10000);
  console.log('SUBMIT:', sb);
  if (sb) { const q = JSON.parse(sb); for (const ty of ['mousePressed','mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type: ty, x: q.x, y: q.y, button: 'left', clickCount: 1 }); }
  await sleep(9000);
  console.log('AFTER-URL:', await cdp.evalT(`location.href`, 6000));
  console.log('AFTER-TXT:', String(await cdp.evalT(`document.body.innerText.slice(0, 400)`, 8000)).replace(/\n+/g, ' | '));
  await cdp.send('Page.captureScreenshot').then(r => fs.writeFileSync('D:/Github/backlink_skills/_win1000_once_after.png', Buffer.from(r.data, 'base64')));
} catch (e) { console.log('ERR', e.message); }
process.exit(0);
