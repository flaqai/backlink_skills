// win1200: manifo 登录重试 (focus验证+insertText)
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(x => x.id === process.argv[2]);
const cdp = new CDP(new WebSocket(tab.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); cdp.ws.addEventListener('error', rej); });
await cdp.send('Page.enable');
async function clickType(sel, text) {
  // scrollIntoView + center坐标 + 点击 + activeElement验证 + insertText
  const loc = await cdp.eval(`(() => {
    const el = document.querySelector('${sel}');
    if (!el) return 'NO-EL';
    el.scrollIntoView({block: 'center'});
    el.focus();
    const r = el.getBoundingClientRect();
    return JSON.stringify({x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), focused: document.activeElement === el});
  })()`);
  console.log(sel, 'LOC:', loc);
  const L = JSON.parse(loc);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: L.x, y: L.y });
  await sleep(150);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: L.x, y: L.y, button: 'left', clickCount: 1 });
  await sleep(80);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: L.x, y: L.y, button: 'left', clickCount: 1 });
  await sleep(500);
  const fchk = await cdp.eval(`document.activeElement.name || document.activeElement.tagName`);
  console.log(sel, 'activeElement:', fchk);
  await cdp.send('Input.insertText', { text });
  await sleep(400);
  const v = await cdp.eval(`(() => { const el = document.querySelector('${sel}'); return el.value || 'EMPTY'; })()`);
  console.log(sel, 'value now:', String(v).slice(0, 40));
}
await clickType('input[name="email"]', 'manifo@92ng.com');
await clickType('input[name="passwd"]', 'Xx@Manifo26!Xm');
// 提交
const sub = await cdp.eval(`(() => {
  const b = document.querySelector('input[type=submit]');
  b.scrollIntoView({block: 'center'});
  const r = b.getBoundingClientRect();
  return JSON.stringify({x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), v: b.value});
})()`);
console.log('SUBMIT:', sub);
const B = JSON.parse(sub);
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: B.x, y: B.y });
await sleep(150);
await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: B.x, y: B.y, button: 'left', clickCount: 1 });
await sleep(100);
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: B.x, y: B.y, button: 'left', clickCount: 1 });
await sleep(9000);
const r = await cdp.eval(`(() => JSON.stringify({url: location.href.slice(0,130), title: document.title.slice(0,50), head: document.body.innerText.slice(0,300)}))()`);
console.log('AFTER:', r);
const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/backlink_skills/storage/_w1200_manifo_after2.png', Buffer.from(shot.data, 'base64'));
