// win1200: manifo 切换到登录tab并提交
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(x => x.id === process.argv[2]);
const cdp = new CDP(new WebSocket(tab.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); cdp.ws.addEventListener('error', rej); });
await cdp.send('Page.enable');
// 点 "Login >" 切换
const sw = await cdp.eval(`(() => {
  const a = [...document.querySelectorAll('a')].find(a => /log\s?in\s?>?/i.test(a.innerText.trim()) && a.getBoundingClientRect().width > 0);
  if (!a) return 'NO-SWITCH';
  const r = a.getBoundingClientRect();
  return JSON.stringify({x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), txt: a.innerText.trim().slice(0,20)});
})()`);
console.log('SWITCH:', sw);
const S = JSON.parse(sw);
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: S.x, y: S.y });
await sleep(200);
await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: S.x, y: S.y, button: 'left', clickCount: 1 });
await sleep(100);
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: S.x, y: S.y, button: 'left', clickCount: 1 });
await sleep(3000);
// 登录表单字段
const form = await cdp.eval(`(() => {
  const inp = [...document.querySelectorAll('input')].filter(i => i.offsetParent && i.getBoundingClientRect().x >= 0).map((i,ix) => ({ix, type: i.type, name: i.name||'', x: Math.round(i.getBoundingClientRect().x + i.getBoundingClientRect().width/2), y: Math.round(i.getBoundingClientRect().y + i.getBoundingClientRect().height/2)}));
  const btn = [...document.querySelectorAll('button,input[type=submit],a')].filter(b => b.offsetParent && /sign\s?in|log\s?in/i.test((b.innerText||b.value||'')) && b.getBoundingClientRect().width > 0).map(b => ({tag: b.tagName, txt: (b.innerText||b.value||'').trim().slice(0,25), x: Math.round(b.getBoundingClientRect().x + b.getBoundingClientRect().width/2), y: Math.round(b.getBoundingClientRect().y + b.getBoundingClientRect().height/2)}));
  return JSON.stringify({inp, btn});
})()`);
console.log('LOGIN FORM:', form);
const F = JSON.parse(form);
const em = F.inp.find(f => f.type === 'email' || f.type === 'text');
const pw = F.inp.find(f => f.type === 'password');
async function typeAt(x, y, text) {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(150);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await sleep(80);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(400);
  await cdp.send('Input.insertText', { text });
  await sleep(300);
}
if (em && pw) {
  await typeAt(em.x, em.y, 'manifo@92ng.com');
  await typeAt(pw.x, pw.y, 'Xx@Manifo26!Xm');
  const chk = await cdp.eval(`(() => {
    const i = [...document.querySelectorAll('input')].filter(x=>x.offsetParent && x.getBoundingClientRect().x>=0);
    return JSON.stringify({em: (i.find(x=>x.type==='email'||x.type==='text')||{}).value, plen: ((i.find(x=>x.type==='password')||{}).value||'').length});
  })()`);
  console.log('READBACK:', chk);
  const b = F.btn[0];
  if (b) {
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: b.x, y: b.y });
    await sleep(150);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: b.x, y: b.y, button: 'left', clickCount: 1 });
    await sleep(100);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b.x, y: b.y, button: 'left', clickCount: 1 });
    console.log('CLICKED', b.txt);
  }
  await sleep(8000);
  const r = await cdp.eval(`(() => JSON.stringify({url: location.href.slice(0,120), title: document.title.slice(0,50), head: document.body.innerText.slice(0,250)}))()`);
  console.log('AFTER:', r);
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('D:/Github/backlink_skills/storage/_w1200_manifo_after.png', Buffer.from(shot.data, 'base64'));
} else { console.log('!! 字段没找齐'); }
