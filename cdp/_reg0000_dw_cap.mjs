import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

// reg0000c2: 勾 tos + 滚动 captcha + 点 hCaptcha checkbox
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())]
  .find(t => t.type === 'page' && /dreamwidth\.org\/create/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });

// tos: JS 勾选 (服务端渲染页原生 checkbox)
console.log('TOS:', await c.evalT(`(function(){var t=document.querySelector('#id-tos-7'); if(!t.checked){t.checked=true; t.dispatchEvent(new Event('change',{bubbles:true}));} return t.checked;})()`, 6000));

// 滚动 captcha 入视口
await c.evalT(`document.querySelector('.h-captcha').scrollIntoView({block:'center'})`);
await sleep(1200);
const cap = await c.evalT(`JSON.stringify((function(){var f=document.querySelector('iframe[src*=hcaptcha]'); var b=f.getBoundingClientRect(); return {x:Math.round(b.x+b.width/2), y:Math.round(b.y+b.height/2)};})())`, 6000);
console.log('CAP:', cap);
const C = JSON.parse(cap);
// hCaptcha checkbox 在 iframe 内偏左 (约 x-121, 中心线)
await ev('mouseMoved', { x: C.x - 121, y: C.y }); await sleep(200);
await ev('mousePressed', { x: C.x - 121, y: C.y, button: 'left', clickCount: 1 }); await sleep(90);
await ev('mouseReleased', { x: C.x - 121, y: C.y, button: 'left', clickCount: 1 });
await sleep(3500);
// 截挑战区
const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/dw_captcha.png', Buffer.from(s.data, 'base64'));
console.log('BODY:', await c.evalT("document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,6).join(' | ').slice(0,200)", 5000));
console.log('SHOT ok');
process.exit(0);
