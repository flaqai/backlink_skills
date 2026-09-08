import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes('qiita.com/drafts/'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
// 1) 弹窗内状态
console.log('弹窗状态:', await c.eval(`(() => JSON.stringify({
  checks: [...document.querySelectorAll('input[type=checkbox]')].map(x => ({ c: x.checked, vis: x.offsetWidth > 0, name: (x.name||''), label: (x.closest('label')||{}).textContent?.trim()?.slice(0,40) })),
  btns: [...document.querySelectorAll('button, input[type=submit]')].filter(e => e.offsetWidth > 0).map(e => (e.textContent||e.value||'').trim().slice(0,30)).filter(t => t)
}))()`));
// 2) 勾选所有可见未勾选 checkbox
await c.eval(`(() => { [...document.querySelectorAll('input[type=checkbox]')].forEach(x => { if (!x.checked) { x.click(); } }); })()`);
await sleep(1000);
console.log('勾选后:', await c.eval(`(() => JSON.stringify([...document.querySelectorAll('input[type=checkbox]')].map(x => x.checked)))()`));
// 3) 点弹窗内「記事を投稿する」
const pb = await c.eval(`(() => { const b = [...document.querySelectorAll('button, input[type=submit]')].find(e => e.offsetWidth > 0 && /記事を投稿する/.test((e.textContent||e.value||''))); if (!b) return 'NO'; b.scrollIntoView({block:'center'}); const r = b.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) }); })()`);
console.log('投稿按钮:', pb);
if (pb !== 'NO') {
  const p = JSON.parse(pb);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await sleep(12000);
  console.log('终态:', await c.eval(`(() => JSON.stringify({ url: location.href.slice(0,80), errs: [...document.querySelectorAll('[class*=error], [role=alert]')].filter(e => e.offsetWidth > 0).map(e => e.textContent.trim().slice(0,60)).slice(0,3) }))()`));
}
