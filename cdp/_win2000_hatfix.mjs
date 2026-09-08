// hatena 标题修复: 首页找最新帖→编辑→改标题→保存
import { CDP, sleep } from './CDP.mjs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent('https://leoxmnotes.hatenablog.com/'), { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id);
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(8000);
// 最新文章链接
const latest = await c.eval(`(() => { const a = [...document.querySelectorAll('a')].find(x => x.href.includes('/the-real-cost-of-qr-codes') || x.href.includes('/static-vs-dynamic-qr-codes')); return a ? a.href : (document.querySelector('h1.entry-title a, .entry-title a') || {}).href || 'NO'; })()`);
console.log('最新帖:', latest);
await c.goto(latest, 30000);
await sleep(6000);
// 进编辑
const edit = await c.eval(`(() => { const a = [...document.querySelectorAll('a')].find(x => /edit/.test(x.href)); return a ? a.href : 'NO'; })()`);
console.log('编辑链接:', edit);
await c.goto(edit, 30000);
await sleep(8000);
// 清标题重填
console.log('改标题:', await c.eval(`(function(){ var inp = document.querySelector('input.field-title, input[name=title], .hatena-editor-title input'); if (!inp) return 'nf'; var d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; d.call(inp, ''); inp.focus(); return 'cleared'; })()`));
await c.send('Input.insertText', { text: 'The Real Cost of QR Codes: What Is Free Forever, What Is a Subscription, and What Pays Off' });
await sleep(1500);
console.log('标题现值:', await c.eval(`(() => (document.querySelector('input.field-title, input[name=title], .hatena-editor-title input')||{}).value?.slice(0,60))()`));
// 保存(投稿ボタン)
console.log('按钮:', await c.eval(`JSON.stringify([...document.querySelectorAll('button, input[type=submit]')].filter(e => e.offsetWidth > 0).map(e => (e.textContent||e.value||'').trim()).filter(t => t && t.length < 20).slice(0, 8))`));
const sb = await c.eval(`(() => { const b = [...document.querySelectorAll('button, input[type=submit]')].find(e => e.offsetWidth > 0 && /^(投稿する|公開する|Save|投稿)/.test((e.textContent||e.value||'').trim())); if (!b) return 'NO'; b.scrollIntoView({block:'center'}); const r = b.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) }); })()`);
console.log('保存按钮:', sb);
if (sb !== 'NO') {
  const s = JSON.parse(sb);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: s.x, y: s.y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: s.x, y: s.y, button: 'left', clickCount: 1 });
  await sleep(8000);
  console.log('终态URL:', await c.eval('location.href'));
}
