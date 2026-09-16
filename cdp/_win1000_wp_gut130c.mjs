// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

const t = await (await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent('https://leoxmseo2.wordpress.com/wp-admin/post.php?post=38&action=edit'), { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const { CDP } = await import('./CDP.mjs');
const c = new CDP(ws);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
await sleep(15000);
const st = await c.eval(`(() => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (!node.parentElement.closest('[contenteditable="true"]')) continue;
    const i = node.textContent.indexOf('smog check history');
    if (i >= 0) {
      const a = document.createElement('a');
      a.href = 'https://smogcheck-nearme.com';
      const r = document.createRange();
      r.setStart(node, i); r.setEnd(node, i + 18);
      try { r.surroundContents(a); } catch (e) { return JSON.stringify({ err: 'surround:' + e.message }); }
      const editable = a.closest('[contenteditable="true"]');
      editable.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
      const marked = [...document.querySelectorAll('a[href="https://smogcheck-nearme.com"]')].pop();
      return JSON.stringify({ linked: !!marked, editable: editable.className.slice(0, 60) });
    }
  }
  return JSON.stringify({ err: 'not-found' });
})()`);
log('手术:', String(st).slice(0, 200));
await sleep(2500);
const btn = await c.eval(`(() => {
  const b = [...document.querySelectorAll('button')].filter(x => /^update$/i.test((x.textContent || '').trim()) && !x.disabled).pop();
  if (!b) return 'no-update-btn:' + [...document.querySelectorAll('button')].map(x => (x.textContent || '').trim()).filter(t => /update|save/i.test(t)).join('|');
  b.scrollIntoView({ block: 'center' });
  const r = b.getBoundingClientRect();
  return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
})()`);
log('Update:', String(btn).slice(0, 200));
if (btn.startsWith('{')) {
  const b = JSON.parse(btn);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: b.x, y: b.y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b.x, y: b.y, button: 'left', clickCount: 1 });
  await sleep(9000);
  const after = await c.eval(`JSON.stringify({ snack: document.querySelector('.components-snackbar__content')?.textContent?.slice(0, 80) || 'none' })`);
  log('保存:', after);
}
await sleep(3000);
const live = await (await fetch('https://leoxmseo2.wordpress.com/2026/09/05/your-vehicles-smog-check-history-why-it-matters-and-how-to-read-it/?nocache=' + Date.now(), { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0' } })).text();
log('线上锚链href:', (live.match(/href="https:\/\/smogcheck-nearme\.com"/g) || []).length, '处');
try { await fetch('http://127.0.0.1:9224/json/close/' + t.id); } catch {}
process.exit(0);
