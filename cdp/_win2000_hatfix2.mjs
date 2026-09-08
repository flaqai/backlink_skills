import { CDP, sleep } from './CDP.mjs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent('https://blog.hatena.ne.jp/leoxm/leoxmnotes.hatenablog.com/entries'), { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id);
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(10000);
// 第一篇文章的编辑链接
const ed = await c.eval(`(() => { const rows = [...document.querySelectorAll('tr, li, .entry-item, article')]; for (const r of rows.slice(0, 6)) { const link = r.querySelector('a[href*="entry/2026/09/02"]'); if (!link) continue; const e = [...r.querySelectorAll('a')].find(a => /edit/.test(a.href)); if (e) return e.href; } const any = [...document.querySelectorAll('a[href*="edit"]')].map(a => a.href).slice(0, 5); return JSON.stringify(any); })()`);
console.log('edit链接:', ed);
if (ed.startsWith('http')) {
  await c.goto(ed, 30000);
  await sleep(8000);
  console.log('编辑页URL:', await c.eval('location.href'));
  console.log('现标题:', await c.eval(`(() => (document.querySelector('input.field-title, input[name=title], .hatena-editor-title input, input[aria-label*=title i]')||{}).value?.slice(0,70))()`));
}
