// reg0000: 删除 nekoweb 违铁律的第2篇养号文(无记录孤儿页不留)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let page = list.find(t => t.type === 'page' && /nekoweb\.org/.test(t.url));
if (!page) { console.log('NO_TAB'); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable');
const login = await c.eval(`(async () => {
  const r = await fetch('/auth/login', { method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: 'username=leoxm&password=' + encodeURIComponent('Xx@Nekoweb26!Xm') });
  return 'status=' + r.status;
})()`);
console.log('LOGIN:', login);
const del = await c.eval(`(async () => {
  const fd = new URLSearchParams(); fd.append('pathname', '/leoxm.nekoweb.org/on-the-habit-of-writing-things-down.html');
  const r = await fetch('/api/files/delete', { method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: fd });
  return 'delete status=' + r.status + ' body=' + (await r.text()).slice(0,80);
})()`);
console.log('DELETE:', del);
await sleep(2500);
const verify = await c.eval(`(async () => { const r = await fetch('https://leoxm.nekoweb.org/on-the-habit-of-writing-things-down.html', {credentials:'omit'}); return 'public status=' + r.status; })()`);
console.log('VERIFY_GONE(404=clean):', verify);
