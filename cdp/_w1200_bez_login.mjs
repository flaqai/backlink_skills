// win1200: blog-ezine 登录 (insertText真实打字)
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(x => x.id === process.argv[2]);
const cdp = new CDP(new WebSocket(tab.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); cdp.ws.addEventListener('error', rej); });
await cdp.send('Page.enable');
// 定位输入框
const fields = await cdp.eval(`(() => {
  const inp = [...document.querySelectorAll('input')].map((i,ix) => ({ix, type: i.type, name: i.name||'', ph: i.placeholder||'', vis: !!i.offsetParent, x: Math.round(i.getBoundingClientRect().x + i.getBoundingClientRect().width/2), y: Math.round(i.getBoundingClientRect().y + i.getBoundingClientRect().height/2)}));
  const btn = [...document.querySelectorAll('button,input[type=submit]')].map((b,ix) => ({ix, tag: b.tagName, txt: (b.innerText||b.value||'').slice(0,30), vis: !!b.offsetParent, x: Math.round(b.getBoundingClientRect().x + b.getBoundingClientRect().width/2), y: Math.round(b.getBoundingClientRect().y + b.getBoundingClientRect().height/2)}));
  return JSON.stringify({inp: inp.filter(f=>f.vis), btn: btn.filter(f=>f.vis)});
})()`);
console.log('FIELDS:', fields);
const F = JSON.parse(fields);
const user = F.inp.find(f => f.type === 'text' || /email|user/i.test(f.name+f.ph));
const pass = F.inp.find(f => f.type === 'password');
if (!user || !pass) { console.log('!! 输入框没找齐'); process.exit(1); }
async function typeAt(x, y, text) {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(200);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await sleep(100);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(500);
  await cdp.send('Input.insertText', { text });
  await sleep(400);
}
await typeAt(user.x, user.y, 'leoxm26');
await typeAt(pass.x, pass.y, 'Xx@BEz26!Xm');
// 回读验证
const chk = await cdp.eval(`(() => {
  const i = [...document.querySelectorAll('input')];
  return JSON.stringify({u: (i.find(x=>x.type==='text')||{}).value, plen: ((i.find(x=>x.type==='password')||{}).value||'').length});
})()`);
console.log('READBACK:', chk);
// 点Log In
const btn = F.btn.find(b => /log\s?in/i.test(b.txt));
if (!btn) { console.log('!! Log In按钮没找到'); process.exit(1); }
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: btn.x, y: btn.y });
await sleep(200);
await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: btn.x, y: btn.y, button: 'left', clickCount: 1 });
await sleep(120);
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: btn.x, y: btn.y, button: 'left', clickCount: 1 });
console.log('CLICKED LogIn');
await sleep(10000);
const r = await cdp.eval(`(() => JSON.stringify({
  url: location.href.slice(0, 140),
  title: document.title.slice(0, 60),
  head: document.body.innerText.slice(0, 260)
}))()`);
console.log('AFTER:', r);
const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/backlink_skills/storage/_w1200_bez_afterlogin.png', Buffer.from(shot.data, 'base64'));
