// win1000 once.tools v2: 动态收集字段(名属性漂移)→按序聚焦→键盘直打→提交
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id, { method: 'PUT' }).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
cdp.on(m => { if (m.method === 'Page.javascriptDialogOpening') { console.log('DIALOG:', m.params.message); cdp.send('Page.handleJavaScriptDialog', { accept: true }).catch(()=>{}); } });
async function typeFocused(text) {
  for (const ch of text) {
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', text: ch, unmodifiedText: ch });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', text: ch, unmodifiedText: ch });
    await sleep(20);
  }
  await sleep(200);
}
// 按序号聚焦第 i 个可见文本字段
async function focusField(i) {
  const r = await cdp.eval(`(() => {
    const els = [...document.querySelectorAll('input,textarea')].filter(e => (e.type === 'text' || e.type === 'email' || e.tagName === 'TEXTAREA'));
    const e = els[${i}];
    if (!e) return 'NOIDX:' + els.length;
    e.scrollIntoView({block:'center'});
    e.focus();
    e.value = '';
    return 'OK:' + (e.name || e.id || e.placeholder || '?') + ':' + e.tagName;
  })()`);
  return r;
}
try {
  await cdp.send('Page.navigate', { url: 'https://once.tools/submit' });
  for (let i = 0; i < 15; i++) { const r = await cdp.evalT(`document.readyState`, 6000).catch(() => 'E'); if (r === 'complete') break; await sleep(2000); }
  await sleep(10000);
  await cdp.eval(`window.scrollTo(0, document.body.scrollHeight / 2)`);
  await sleep(2000);
  console.log('COUNT:', await cdp.eval(`(() => JSON.stringify([...document.querySelectorAll('input,textarea')].filter(e => (e.type === 'text' || e.type === 'email' || e.tagName === 'TEXTAREA')).map((e, i) => i + ':' + (e.name || e.id || e.placeholder || '?'))))()`));
  const VALUES = ['Leo Xm', 'once.merge@92ng.com', 'Merge Infinity', 'https://crazyshark.org/', 'Free puzzle merge game with endless combination chains.', 'Play Merge Infinity, a free puzzle merge game. Combine items, chain upgrades and unlock new boards with quick matches, no downloads, instant fun.', 'Free'];
  for (let i = 0; i < VALUES.length; i++) {
    const f = await focusField(i);
    console.log('FOCUS' + i + ':', f);
    if (String(f).startsWith('OK')) { await typeFocused(VALUES[i]); }
  }
  await cdp.send('Page.captureScreenshot').then(r => fs.writeFileSync('D:/Github/backlink_skills/_win1000_once_v3_filled.png', Buffer.from(r.data, 'base64')));
  const sb = await cdp.evalT(`(() => { const b = [...document.querySelectorAll('button,input[type=submit]')].find(x => /submit tool/i.test((x.textContent || x.value || ''))); if (!b) return null; b.scrollIntoView({block:'center'}); const r = b.getBoundingClientRect(); return JSON.stringify({x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), txt: (b.textContent || b.value || '').trim().slice(0, 30)}); })()`, 10000);
  console.log('SUBMIT:', sb);
  if (sb) { const q = JSON.parse(sb); for (const ty of ['mousePressed','mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type: ty, x: q.x, y: q.y, button: 'left', clickCount: 1 }); }
  await sleep(9000);
  console.log('AFTER-URL:', await cdp.evalT(`location.href`, 6000));
  console.log('AFTER-TXT:', String(await cdp.evalT(`document.body.innerText.slice(0, 400)`, 8000)).replace(/\n+/g, ' | '));
  await cdp.send('Page.captureScreenshot').then(r => fs.writeFileSync('D:/Github/backlink_skills/_win1000_once_v3_after.png', Buffer.from(r.data, 'base64')));
} catch (e) { console.log('ERR', e.message); }
process.exit(0);
