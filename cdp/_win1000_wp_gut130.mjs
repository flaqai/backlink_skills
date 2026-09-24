// win1000: Gutenberg编辑器给post38正文首处"smog check history"加链接
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
  const ifr = document.querySelector('iframe[name=editor-canvas], iframe.editor-canvas__iframe') || [...document.querySelectorAll('iframe')].find(f => /editor|canvas/.test(f.name + f.className));
  if (!ifr) return JSON.stringify({ err: 'no-iframe', iframes: [...document.querySelectorAll('iframe')].map(f => f.name + '|' + f.className).join(';').slice(0, 150) });
  const d = ifr.contentDocument;
  const walker = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const i = node.textContent.indexOf('smog check history');
    if (i >= 0) {
      const r = d.createRange();
      r.setStart(node, i); r.setEnd(node, i + 18);
      const sel = ifr.contentWindow.getSelection();
      sel.removeAllRanges(); sel.addRange(r);
      d.execCommand('createLink', false, 'https://smogcheck-nearme.com');
      const a = d.querySelector('a[href="https://smogcheck-nearme.com"]');
      return JSON.stringify({ linked: !!a, text: a ? a.textContent : '', sel: sel.toString() });
    }
  }
  return JSON.stringify({ err: 'phrase-not-found' });
})()`);
log('编辑:', st);
await sleep(1500);
// Update按钮
const btn = await c.eval(`(() => {
  const b = [...document.querySelectorAll('button')].filter(x => /^(update|save)$/i.test((x.textContent || '').trim()) && !x.disabled).pop();
  if (!b) return 'no-btn:' + [...document.querySelectorAll('button')].map(x => (x.textContent || '').trim()).filter(Boolean).slice(0, 20).join('|');
  b.scrollIntoView({ block: 'center' });
  const r = b.getBoundingClientRect();
  return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), t: (b.textContent || '').trim() });
})()`);
log('按钮:', String(btn).slice(0, 180));
if (btn.startsWith('{')) {
  const b = JSON.parse(btn);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: b.x, y: b.y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b.x, y: b.y, button: 'left', clickCount: 1 });
  await sleep(8000);
  const after = await c.eval(`JSON.stringify({ snack: document.querySelector('.components-snackbar__content')?.textContent?.slice(0, 80) || 'none' })`);
  log('保存:', after);
}
await sleep(3000);
const live = await (await fetch('https://leoxmseo2.wordpress.com/2026/09/05/your-vehicles-smog-check-history-why-it-matters-and-how-to-read-it/?nocache=' + Date.now(), { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0' } })).text();
log('线上锚链href:', (live.match(/href="https:\/\/smogcheck-nearme\.com"/g) || []).length, '处');
try { await fetch('http://127.0.0.1:9224/json/close/' + t.id); } catch {}
process.exit(0);
