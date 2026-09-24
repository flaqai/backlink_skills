// win1200: manifo 登录 (头部Log-in → 登录表单)
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(x => x.id === process.argv[2]);
const cdp = new CDP(new WebSocket(tab.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); cdp.ws.addEventListener('error', rej); });
await cdp.send('Page.enable');
// 点头部 Log-in
const nav = await cdp.eval(`(() => {
  const a = [...document.querySelectorAll('a')].find(a => /^log-?in$/i.test(a.innerText.trim()));
  if (!a) return 'NO-LINK';
  const r = a.getBoundingClientRect();
  return JSON.stringify({x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), href: a.href});
})()`);
console.log('LOGIN LINK:', nav);
const N = JSON.parse(nav);
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: N.x, y: N.y });
await sleep(200);
await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: N.x, y: N.y, button: 'left', clickCount: 1 });
await sleep(100);
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: N.x, y: N.y, button: 'left', clickCount: 1 });
await sleep(4000);
// 看登录表单形态
const form = await cdp.eval(`(() => {
  const inp = [...document.querySelectorAll('input')].map((i,ix) => ({ix, type: i.type, name: i.name||'', vis: !!i.offsetParent, x: Math.round(i.getBoundingClientRect().x + i.getBoundingClientRect().width/2), y: Math.round(i.getBoundingClientRect().y + i.getBoundingClientRect().height/2)}));
  const btn = [...document.querySelectorAll('button,input[type=submit],a.btn')].map((b,ix) => ({ix, tag: b.tagName, txt: (b.innerText||b.value||'').slice(0,30), vis: !!b.offsetParent, x: Math.round(b.getBoundingClientRect().x + b.getBoundingClientRect().width/2), y: Math.round(b.getBoundingClientRect().y + b.getBoundingClientRect().height/2)}));
  return JSON.stringify({inp: inp.filter(f=>f.vis), btn: btn.filter(f=>f.vis).slice(0,6)});
})()`);
console.log('FORM:', form);
const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/backlink_skills/storage/_w1200_manifo_loginform.png', Buffer.from(shot.data, 'base64'));
