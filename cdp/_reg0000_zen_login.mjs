import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// reg0000 0906 thezenweb登录: /login 填username+password提交, 成功判据=Dashboard/editor类页面
const [domain, username, password] = process.argv.slice(2);
const log = (...a) => console.log(...a);
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://' + domain + '/login', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(6000);
const clickXY = async (x, y) => { await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }); await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }); };
const fill = async (sel, text) => {
  const r = await c.eval(`(function(){ const i=${sel}; if(!i) return null; i.scrollIntoView({block:'center'}); i.focus(); const b=i.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}); })()`);
  if (!r) { log('MISS', sel); return false; }
  const p = JSON.parse(r); await clickXY(p.x, p.y); await sleep(200); await c.send('Input.insertText', { text }); await sleep(200);
  return true;
};
const form = await c.eval(`JSON.stringify({user:!!document.querySelector('input[name=username]'),pass:!!document.querySelector('input[name=password]'),cap:!!document.querySelector('input[name=captcha]'),url:location.href})`);
log('FORM:', form);
await fill(`document.querySelector('input[name=username]')`, username);
await fill(`document.querySelector('input[name=password]')`, password);
// 登录验证码(若有): 截图退出让人判读
const hasCap = JSON.parse(form).cap;
if (hasCap) {
  const cap = await c.eval(`(function(){ const img=document.querySelector('img[src*="captcha"]'); if(!img) return null; img.scrollIntoView({block:'center'}); const r=img.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}); })()`);
  log('LOGIN_CAPTCHA:', cap);
  const shot = await c.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('D:/Github/seoadminC/storage/_reg0000_zen_lgcap.png', Buffer.from(shot.data, 'base64'));
  log('CAP_SHOT_SAVED_EXIT'); process.exit(3);
}
const btn = await c.eval(`(function(){ const b=[...document.querySelectorAll('button,input[type=submit],a.btn')].find(x=>/sign in|log ?in/i.test(x.innerText||x.value||'')&&x.offsetParent); if(!b) return null; b.scrollIntoView({block:'center'}); const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`);
if (!btn) { log('NO_LOGIN_BTN'); process.exit(1); }
const p = JSON.parse(btn); await clickXY(p.x, p.y);
log('LOGIN_CLICKED');
await sleep(8000);
const after = await c.eval(`JSON.stringify({url:location.href,head:document.body.innerText.replace(/\\s+/g,' ').slice(0,250)})`);
log('AFTER:', after);
const a = JSON.parse(after);
if (/dashboard|sign.?out|logout|new post|write|admin/i.test(a.head + a.url)) { log('LOGIN_OK_KEEP_TAB'); process.exit(0); }
log('LOGIN_UNCERTAIN'); process.exit(2);
