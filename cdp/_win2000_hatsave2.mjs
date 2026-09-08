import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes('edit?entry=1494577603207'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const sb = await c.eval(`(() => { const b = [...document.querySelectorAll('button, input[type=submit]')].find(e => (e.textContent||e.value||'').trim() === '更新する'); if (!b) return 'NO'; b.scrollIntoView({block:'center'}); const r = b.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) }); })()`);
console.log('更新する:', sb);
if (sb !== 'NO') {
  const s = JSON.parse(sb);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: s.x, y: s.y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: s.x, y: s.y, button: 'left', clickCount: 1 });
  await sleep(9000);
  console.log('终态:', await c.eval(`(() => JSON.stringify({ url: location.href.slice(0,100), hasAlert: !!document.querySelector('.alert, [role=alert]') }))()`));
}
