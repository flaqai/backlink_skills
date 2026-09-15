import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// reg0000 0906 blogminds(tblogz同款Confident族)注册: 单连接完成填表+提交+checkbox+九宫格截图
const [domain, email, password, username] = process.argv.slice(2);
const log = (...a) => console.log(...a);
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://' + domain + '/signup', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x, y) => { await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }); await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }); };
const fill = async (sel, text) => {
  const r = await c.eval(`(function(){ const i=${sel}; if(!i) return null; i.scrollIntoView({block:'center'}); i.focus(); const b=i.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}); })()`);
  if (!r) { log('MISS', sel); return false; }
  const p = JSON.parse(r); await clickXY(p.x, p.y); await sleep(200); await c.send('Input.insertText', { text }); await sleep(200);
  return true;
};
await sleep(6000);
await fill(`document.querySelector('input[name=email]')`, email);
await fill(`document.querySelector('input[name=password]')`, password);
if (username) await fill(`document.querySelector('input[name=username]')`, username);
const btn = await c.eval(`(function(){ const x=[...document.querySelectorAll('input[type=submit],button')].find(e=>/create|sign ?up|register/i.test(e.innerText||e.value||'')&&e.offsetParent); if(!x) return null; x.scrollIntoView({block:'center'}); const r=x.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),txt:(x.innerText||x.value||'').slice(0,20)}); })()`);
if (!btn) { log('NO_BTN'); process.exit(1); }
const bp = JSON.parse(btn);
log('BTN', JSON.stringify(bp));
await clickXY(bp.x, bp.y);
log('SUBMIT1');
await sleep(5000);
// 查九宫格是否已弹; 未弹则点checkbox
let st = await c.eval(`(function(){ const w=document.querySelector('#captcha_window'); const vis=w&&getComputedStyle(w).display!=='none'&&w.getBoundingClientRect().height>50; const m=document.body.innerText.match(/Select all images with ([^.]+)\\./); return JSON.stringify({task:m?m[1]:null, winH:w?Math.round(w.getBoundingClientRect().height):0}); })()`);
log('ST1:', st);
const s1 = JSON.parse(st);
if (!s1.task) {
  const cb = await c.eval(`(function(){ const d=document.querySelector('#captcha_div,[id*=captcha_div]'); if(!d) return null; const b=d.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+20),y:Math.round(b.y+b.height/2)}); })()`);
  if (cb) { const p = JSON.parse(cb); await clickXY(p.x, p.y); log('CHECKBOX_CLICKED'); await sleep(5000); }
  st = await c.eval(`(function(){ const m=document.body.innerText.match(/Select all images with ([^.]+)\\./); return JSON.stringify({task:m?m[1]:null}); })()`);
  log('ST2:', st);
}
const s2 = JSON.parse(st);
if (s2.task) {
  const shot = await c.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('D:/Github/seoadminC/storage/_reg0000_bm_cap.png', Buffer.from(shot.data, 'base64'));
  log('TASK=' + s2.task, 'TABID=' + t.id);
} else {
  const after = await c.eval(`JSON.stringify({url:location.href, head:document.body.innerText.replace(/\\s+/g,' ').slice(0,120)})`);
  log('AFTER:', after);
}
process.exit(0);
