// win1200: 激活tab+reload+长等CF盾
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(x => x.id === process.argv[2]);
const cdp = new CDP(new WebSocket(tab.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); cdp.ws.addEventListener('error', rej); });
await cdp.send('Page.enable');
await cdp.send('Page.reload');
await sleep(15000);
const r = await cdp.eval(`(() => JSON.stringify({
  url: location.href.slice(0, 140),
  title: document.title.slice(0, 60),
  cf: /安全验证|请稍候|Checking your browser|Just a moment/i.test(document.body.innerText.slice(0,300)),
  head: document.body.innerText.slice(0, 200)
}))()`);
console.log('AFTER15S:', r);
const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/backlink_skills/storage/_w1200_bez_cf2.png', Buffer.from(shot.data, 'base64'));
