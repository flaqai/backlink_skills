import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// reg0000 0906 thezenweb族注册第二段: 填captcha+勾agree+点REGISTER+判结果
// 用法: node _reg0000_zen_submit.mjs <domain> <captchaCode>
const [domain, code] = process.argv.slice(2);
const log = (...a) => console.log(...a);
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes(domain));
if (!tab) { log('NO_TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x, y) => { await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }); await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }); };
const clickSel = async (sel) => {
  const r = await c.eval(`(function(){ const i=${sel}; if(!i) return null; i.scrollIntoView({block:'center'}); const b=i.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}); })()`);
  if (!r) return false;
  const p = JSON.parse(r); await clickXY(p.x, p.y); return true;
};
const fill = async (sel, text) => {
  const r = await c.eval(`(function(){ const i=${sel}; if(!i) return null; i.scrollIntoView({block:'center'}); i.focus(); const b=i.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}); })()`);
  if (!r) { log('MISS', sel); return false; }
  const p = JSON.parse(r); await clickXY(p.x, p.y); await sleep(200); await c.send('Input.insertText', { text }); await sleep(200);
  return true;
};
await fill(`document.querySelector('input[name=captcha]')`, code);
const agree = await c.eval(`(function(){ const a=document.querySelector('input[name=agree]'); if(!a) return 'NO'; return a.checked?'CHECKED':'UNCHECKED'; })()`);
log('AGREE:', agree);
if (agree === 'UNCHECKED') { const ok = await clickSel(`document.querySelector('input[name=agree]')`); log('AGREE_CLICKED', ok); await sleep(300); }
await sleep(500);
const btn = await c.eval(`(function(){ const b=[...document.querySelectorAll('button,input[type=submit]')].find(x=>/register/i.test(x.innerText||x.value||'')&&x.offsetParent); if(!b) return null; b.scrollIntoView({block:'center'}); const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`);
if (!btn) { log('NO_REGISTER_BTN'); process.exit(1); }
const p = JSON.parse(btn); await clickXY(p.x, p.y);
log('REGISTER_CLICKED');
await sleep(8000);
const after = await c.eval(`JSON.stringify({url:location.href,err:(document.querySelector('.error,.alert-danger,[class*=error]')||{innerText:''}).innerText.slice(0,150),head:document.body.innerText.replace(/\\s+/g,' ').slice(0,200)})`);
log('AFTER:', after);
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/seoadminC/storage/_reg0000_zen_after.png', Buffer.from(shot.data, 'base64'));
const a = JSON.parse(after);
if (/dashboard|sign.?out|logout|welcome|congratulations|your blog/i.test(a.head + a.url)) { log('REG_OK_KEEP_TAB'); process.exit(0); }
log('REG_UNCERTAIN_SHOT');
process.exit(2);
