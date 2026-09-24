import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// reg0000 0906 writeablog.net注册: alias+email+pass+reCAPTCHA checkbox
const [domain, alias, email, password] = process.argv.slice(2);
const log = (...a) => console.log(...a);
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://' + domain + '/signup', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(7000);
const clickXY = async (x, y) => { await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }); await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }); };
const fill = async (sel, text) => {
  const r = await c.eval(`(function(){ const i=${sel}; if(!i) return null; i.scrollIntoView({block:'center'}); i.focus(); const b=i.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}); })()`);
  if (!r) { log('MISS', sel); return false; }
  const p = JSON.parse(r); await clickXY(p.x, p.y); await sleep(200); await c.send('Input.insertText', { text }); await sleep(200);
  return true;
};
await fill(`document.querySelector('input[name=alias]')`, alias);
await fill(`document.querySelector('input[name=email]')`, email);
await fill(`document.querySelector('input[name=pass]')`, password);
// reCAPTCHA anchor 位置
const rc = await c.eval(`(function(){ const f=document.querySelector('iframe[src*="recaptcha"],iframe[title*="recaptcha"]'); if(!f) return null; const r=f.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+30),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)}); })()`);
log('RC:', rc);
if (rc) {
  const box = JSON.parse(rc);
  await clickXY(box.x, box.y);
  log('CLICKED_CHECKBOX');
  await sleep(7000);
}
const st = await c.eval(`JSON.stringify({url:location.href, bframe:!!document.querySelector('iframe[src*="bframe"],iframe[title*="challenge"]'), gresp:(document.querySelector('#g-recaptcha-response')||{value:''}).value.length, head:document.body.innerText.replace(/\\s+/g,' ').slice(0,120)})`);
log('ST:', st);
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/seoadminC/storage/_reg0000_wab_rc.png', Buffer.from(shot.data, 'base64'));
log('TABID=' + t.id);
process.exit(0);
