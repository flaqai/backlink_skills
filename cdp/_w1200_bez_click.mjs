// win1200: 真实鼠标点击CF Turnstile勾选框
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(x => x.id === process.argv[2]);
const cdp = new CDP(new WebSocket(tab.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); cdp.ws.addEventListener('error', rej); });
await cdp.send('Page.enable');
const [x, y] = [Number(process.argv[3]) || 255, Number(process.argv[4]) || 313];
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
await sleep(400);
await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
await sleep(120);
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
console.log('CLICKED at', x, y);
await sleep(12000);
const r = await cdp.eval(`(() => JSON.stringify({
  url: location.href.slice(0, 140),
  title: document.title.slice(0, 60),
  cf: /安全验证|请稍候|Checking your browser|Just a moment/i.test(document.body.innerText.slice(0,300)),
  head: document.body.innerText.slice(0, 240)
}))()`);
console.log('AFTER12S:', r);
const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/backlink_skills/storage/_w1200_bez_cf3.png', Buffer.from(shot.data, 'base64'));
