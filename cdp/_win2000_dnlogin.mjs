import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const page = list.find(t => t.type === 'page' && /directorynode/.test(t.url));
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const click = async (x, y) => {
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};
// dump 登录表单
console.log('表单:', await c.eval(`(() => JSON.stringify([...document.querySelectorAll('input')].map(i => ({ n: i.name, t: i.type, vis: i.offsetWidth > 0 })), null, 0))()`));
// 填邮箱
const ue = await c.eval(`(() => { const u = document.querySelector('input[type=email], input[name*=user], input[name*=mail], #user_login'); if (!u) return 'NO'; u.scrollIntoView({block:'center'}); u.focus(); const r = u.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) }); })()`);
if (ue === 'NO') { console.log('无用户框'); process.exit(1); }
const up = JSON.parse(ue);
await click(up.x, up.y);
await sleep(500);
await c.send('Input.insertText', { text: 'dn@92ng.com' });
await sleep(400);
// 填密码
const pe = await c.eval(`(() => { const p = document.querySelector('input[type=password]'); if (!p) return 'NO'; p.focus(); const r = p.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) }); })()`);
const pp = JSON.parse(pe);
await click(pp.x, pp.y);
await sleep(400);
await c.send('Input.insertText', { text: 'Xx@Dnode26!Xm' });
await sleep(400);
console.log('填写完成');
// 登录按钮
const btn = await c.eval(`(() => { const b = [...document.querySelectorAll('button, input[type=submit]')].find(x => /log ?in|sign in/i.test(x.innerText || x.value || '') && x.offsetWidth > 0); if (!b) return 'NO'; b.scrollIntoView({block:'center'}); const rc = b.getBoundingClientRect(); return JSON.stringify({ x: Math.round(rc.x + rc.width/2), y: Math.round(rc.y + rc.height/2), t: (b.innerText||b.value||'').slice(0,20) }); })()`);
console.log('按钮:', btn);
if (btn !== 'NO') {
  const b = JSON.parse(btn);
  await click(b.x, b.y);
  await sleep(8000);
  console.log('登录后URL:', await c.eval('location.href.slice(0,70)'));
  console.log('头像/用户:', await c.eval(`(() => { const t = document.body.innerText.slice(0, 300); return JSON.stringify({ hasDn: t.includes('dn@92ng') || t.includes('leoxm'), logout: t.toLowerCase().includes('log out') || t.toLowerCase().includes('logout') }); })()`));
}
