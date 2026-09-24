import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// reg0000 0906 thezenweb族(security_id+cool-php-captcha)注册第一段: 填表+截captcha
// 用法: node _reg0000_zen_fill.mjs <domain> <username> <email> <password>
const [domain, username, email, password] = process.argv.slice(2);
const log = (...a) => console.log(...a);
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://' + domain + '/signup', { method: 'PUT' })).json();
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
// 表单探测: 接受 input[name=...] 直接定位
const form = await c.eval(`JSON.stringify({user:!!document.querySelector('input[name=username]'),email:!!document.querySelector('input[name=email]'),pass:!!document.querySelector('input[name=password]'),cap:!!document.querySelector('input[name=captcha]'),agree:!!document.querySelector('input[name=agree]'),secid:(document.querySelector('input[name=security_id]')||{}).value||null,url:location.href})`);
log('FORM:', form);
const f = JSON.parse(form);
if (!f.user || !f.email || !f.pass) { log('NO_FORM'); process.exit(1); }
await fill(`document.querySelector('input[name=username]')`, username);
await fill(`document.querySelector('input[name=email]')`, email);
await fill(`document.querySelector('input[name=password]')`, password);
// captcha 图片定位+截图
const cap = await c.eval(`(function(){ const img=document.querySelector('img[src*="captcha"],img[id*="captcha"],img[class*="captcha"]'); if(!img) return null; img.scrollIntoView({block:'center'}); const r=img.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),src:(img.src||'').slice(0,80)}); })()`);
log('CAPTCHA_IMG:', cap);
if (!cap) { log('NO_CAPTCHA_IMG'); process.exit(2); }
const cp = JSON.parse(cap);
await sleep(1500);
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/seoadminC/storage/_reg0000_zen_cap.png', Buffer.from(shot.data, 'base64'));
log('SHOT_SAVED clip_hint=' + JSON.stringify(cp));
log('TABID=' + t.id);
process.exit(0);
