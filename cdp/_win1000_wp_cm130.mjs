// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

import { readFileSync } from 'fs';
const anchorHTML = '<p>If you are sorting through your own records and want a second opinion, the <a href="https://smogcheck-nearme.com">smog check history</a> guide at smogcheck-nearme.com explains what each result line means without the jargon.</p>';
const t = await (await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent('https://leoxmseo2.wordpress.com/wp-admin/post.php?post=38&action=edit'), { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const { CDP } = await import('./CDP.mjs');
const c = new CDP(ws);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
await sleep(15000);
const probe = await c.eval(`(() => {
  const cmEl = document.querySelector('.cm-content');
  const view = cmEl && (cmEl.cmView?.view || cmEl.cmView);
  if (!view || !view.state) return JSON.stringify({ err: 'no-cmview', cm: !!cmEl, keys: cmEl ? Object.keys(cmEl).slice(0,10).join(',') : '' });
  return JSON.stringify({ ok: true, len: view.state.doc.toString().length, hasBlock: view.state.doc.toString().includes('wp:paragraph') });
})()`);
log('CM:', probe);
const p = JSON.parse(probe);
if (!p.ok) process.exit(3);
const r2 = await c.eval(`(() => {
  const view = document.querySelector('.cm-content').cmView.view;
  let doc = view.state.doc.toString();
  if (doc.includes('smogcheck-nearme.com')) return 'already-linked';
  const blockAnchor = ${JSON.stringify('<!-- wp:paragraph -->\n' + anchorHTML + '\n<!-- /wp:paragraph -->')};
  let pos = -1, ins = '';
  const firstP = doc.indexOf('</p>');
  if (firstP < 0) return 'no-p';
  const closeCmt = doc.indexOf('<!-- /wp:paragraph -->', firstP);
  if (closeCmt >= 0) { pos = closeCmt + '<!-- /wp:paragraph -->'.length; ins = '\n\n' + blockAnchor; }
  else { pos = firstP + 4; ins = blockAnchor; }
  view.dispatch({ changes: { from: pos, insert: ins } });
  return 'inserted@' + pos;
})()`);
log('插入:', r2);
await sleep(2500);
// Save → 面板 → Update
const saveBtn = await c.eval(`(() => {
  const b = [...document.querySelectorAll('button')].filter(x => /^save$/i.test((x.textContent || '').trim()) && !x.disabled).pop();
  if (!b) return 'no-save';
  b.scrollIntoView({ block: 'center' });
  const r = b.getBoundingClientRect();
  return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
})()`);
log('Save按钮:', saveBtn);
if (saveBtn.startsWith('{')) {
  const b = JSON.parse(saveBtn);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: b.x, y: b.y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b.x, y: b.y, button: 'left', clickCount: 1 });
  await sleep(5000);
}
const upd = await c.eval(`(() => {
  const b = [...document.querySelectorAll('button')].filter(x => /^(update|publish|save)$/i.test((x.textContent || '').trim()) && !x.disabled).pop();
  if (!b) return 'no-panel-btn:' + [...document.querySelectorAll('button')].map(x => (x.textContent || '').trim()).filter(Boolean).slice(-15).join('|');
  b.scrollIntoView({ block: 'center' });
  const r = b.getBoundingClientRect();
  return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), t: (b.textContent || '').trim() });
})()`);
log('面板按钮:', String(upd).slice(0, 240));
if (upd.startsWith('{')) {
  const b = JSON.parse(upd);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: b.x, y: b.y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b.x, y: b.y, button: 'left', clickCount: 1 });
  await sleep(9000);
  const after = await c.eval(`JSON.stringify({ snack: document.querySelector('.components-snackbar__content')?.textContent?.slice(0, 80) || 'none' })`);
  log('结果:', after);
}
await sleep(3000);
const live = await (await fetch('https://leoxmseo2.wordpress.com/2026/09/05/your-vehicles-smog-check-history-why-it-matters-and-how-to-read-it/?nocache=' + Date.now(), { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0' } })).text();
log('线上锚链href:', (live.match(/href="https:\/\/smogcheck-nearme\.com"/g) || []).length, '处');
try { await fetch('http://127.0.0.1:9224/json/close/' + t.id); } catch {}
process.exit(0);
