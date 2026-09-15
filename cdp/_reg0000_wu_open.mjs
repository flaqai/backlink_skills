import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

// reg0000g: writeupcafe /register 表单填写
const mk = await fetch('http://127.0.0.1:9224/json/new?https://www.writeupcafe.com/register/', { method: 'PUT' }).then(r => r.json());
await sleep(1500);
await fetch(`http://127.0.0.1:9224/json/activate/${mk.id}`).catch(() => {});
await sleep(5000);
const ws = new WebSocket(mk.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });

const clickInput = async (sel) => {
  const p = await c.evalT(`(function(){var e=document.querySelector('${sel}'); if(!e) return 'NO'; e.scrollIntoView({block:'center'}); var r=e.getBoundingClientRect(); return [Math.round(r.x+r.width/2), Math.round(r.y+r.height/2)].join('|');})()`, 8000);
  if (p === 'NO') return false;
  const [x, y] = p.split('|').map(Number);
  await sleep(350);
  await ev('mouseMoved', { x, y }); await sleep(120);
  await ev('mousePressed', { x, y, button: 'left', clickCount: 1 }); await sleep(80);
  await ev('mouseReleased', { x, y, button: 'left', clickCount: 1 }); await sleep(300);
  return true;
};

const ok1 = await clickInput('#username');
await c.send('Input.insertText', { text: 'leoxmwuc' }); await sleep(300);
const ok2 = await clickInput('#email');
await c.send('Input.insertText', { text: 'writeupcafe@92ng.com' }); await sleep(300);
const ok3 = await clickInput('#password');
await c.send('Input.insertText', { text: 'Xx@Wuc26!Xm' }); await sleep(300);
const ok4 = await clickInput('#password_confirm');
await c.send('Input.insertText', { text: 'Xx@Wuc26!Xm' }); await sleep(300);
console.log('FILLED:', [ok1, ok2, ok3, ok4].join(','));

console.log('VALS:', await c.evalT(`(function(){var u=document.querySelector('#username'),e=document.querySelector('#email'),p=document.querySelector('#password'); return 'u='+((u&&u.value)||'')+' e='+((e&&e.value)||'')+' plen='+(p?p.value.length:0);})()`, 8000));
// reCAPTCHA checkbox 位置
console.log('CAP:', await c.evalT(`(function(){var f=document.querySelector('iframe[src*=recaptcha], iframe[title*=recaptcha], iframe[title*=reCAPTCHA]'); if(!f) return 'NO_IFRAME'; f.scrollIntoView({block:'center'}); var r=f.getBoundingClientRect(); return [Math.round(r.x+r.width/2), Math.round(r.y+r.height/2), Math.round(r.width), Math.round(r.height)].join('|');})()`, 8000));
const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/wu_filled.png', Buffer.from(s.data, 'base64'));
console.log('tab=' + mk.id + ' SHOT ok');
process.exit(0);
