import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

// reg0000c: dreamwidth /create 填表 (不含captcha)
const mk = await fetch('http://127.0.0.1:9224/json/new?https://www.dreamwidth.org/create', { method: 'PUT' }).then(r => r.json());
await sleep(1500);
await fetch(`http://127.0.0.1:9224/json/activate/${mk.id}`).catch(() => {});
await sleep(5000);
const ws = new WebSocket(mk.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
const click = async (x, y) => {
  await ev('mouseMoved', { x, y }); await sleep(120);
  await ev('mousePressed', { x, y, button: 'left', clickCount: 1 }); await sleep(80);
  await ev('mouseReleased', { x, y, button: 'left', clickCount: 1 }); await sleep(300);
};

// 找各字段坐标
const pos = await c.evalT(`JSON.stringify((function(){
  var g = function(sel){ var e = document.querySelector(sel); if(!e||e.offsetParent===null) return null; var b = e.getBoundingClientRect(); return {x: Math.round(b.x + b.width/2), y: Math.round(b.y + b.height/2)}; };
  return {
    user: g('#js-user'), email: g('input[name=email]'), p1: g('input[name=password1]'), p2: g('input[name=password2]'),
    yyyy: g('input[name=bday_yyyy]'), tos: g('#id-tos-7'), cap: g('.h-captcha iframe'), capBox: g('iframe[src*=hcaptcha]')
  };
})())`, 8000);
console.log('POS:', pos);
const P = JSON.parse(pos);

const type = async (pt, text) => {
  await click(pt.x, pt.y);
  await c.send('Input.insertText', { text });
  await sleep(250);
};
if (P.user) await type(P.user, 'dreamwleoxm');
if (P.email) await type(P.email, 'dreamwidth@92ng.com');
if (P.p1) await type(P.p1, 'Xx@Dw26!Xm');
if (P.p2) await type(P.p2, 'Xx@Dw26!Xm');
if (P.yyyy) await type(P.yyyy, '1988');
// 生日 select: JS 原生设值+change 事件 (服务端渲染页, 原生 select 可用 JS)
await c.evalT(`(function(){var mm=document.querySelector('select[name=bday_mm]'); mm.value='5'; mm.dispatchEvent(new Event('change',{bubbles:true})); var dd=document.querySelector('select[name=bday_dd]'); dd.value='15'; dd.dispatchEvent(new Event('change',{bubbles:true}));})()`);
await sleep(300);
// tos checkbox
if (P.tos) await click(P.tos.x, P.tos.y);
await sleep(400);

console.log('VALS:', await c.evalT(`JSON.stringify({u:document.querySelector('#js-user')?.value, e:document.querySelector('input[name=email]')?.value, mm:document.querySelector('select[name=bday_mm]')?.value, dd:document.querySelector('select[name=bday_dd]')?.value, yyyy:document.querySelector('input[name=bday_yyyy]')?.value, tos:document.querySelector('#id-tos-7')?.checked})`, 6000));
// captcha iframe 位置
console.log('CAP:', await c.evalT(`JSON.stringify([...document.querySelectorAll('iframe')].map(function(f){var b=f.getBoundingClientRect(); return {src:(f.src||'').slice(0,60), x:Math.round(b.x+b.width/2), y:Math.round(b.y+b.height/2), w:b.width, h:b.height}}).filter(function(v){return /captcha/.test(v.src)}))`, 6000));
const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/dw_filled.png', Buffer.from(s.data, 'base64'));
console.log('tab=' + mk.id + ' SHOT ok');
process.exit(0);
