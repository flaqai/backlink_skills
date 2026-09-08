import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes('edit?entry=1494577603207'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const all = await c.eval(`(() => JSON.stringify([...document.querySelectorAll('button, input[type=submit]')].map(e => ({ t: (e.textContent||e.value||'').trim(), vis: e.offsetWidth > 0 })).filter(x => x.t && x.t.length < 15).slice(0, 40)))()`);
console.log('全部按钮:', all);
const sb = await c.eval(`(() => { const b = [...document.querySelectorAll('button, input[type=submit]')].find(e => /投稿する|公開する/.test((e.textContent||e.value||''))); if (!b) return 'NO'; b.scrollIntoView({block:'center'}); const r = b.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), t: (e => (e.textContent||e.value||'').trim())(b) }); })()`);
console.log('目标按钮:', sb);
if (sb !== 'NO') {
  const s = JSON.parse(sb);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: s.x, y: s.y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: s.x, y: s.y, button: 'left', clickCount: 1 });
  await sleep(9000);
  console.log('终态:', await c.eval('location.href.slice(0,100)'));
}
