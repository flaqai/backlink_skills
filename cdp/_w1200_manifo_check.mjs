// win1200: manifo 登录态+补资料入口侦察
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await fetch(`http://127.0.0.1:9224/json/activate/${t.id}`);
const cdp = new CDP(new WebSocket(t.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); cdp.ws.addEventListener('error', rej); });
await cdp.send('Page.enable');
await cdp.send('Page.navigate', { url: 'https://www.manifo.com/' });
await sleep(10000);
const r = await cdp.eval(`(() => JSON.stringify({
  url: location.href.slice(0, 120),
  title: document.title.slice(0, 50),
  head: document.body.innerText.slice(0, 350)
}))()`);
console.log('HOME:', r);
const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/backlink_skills/storage/_w1200_manifo_home.png', Buffer.from(shot.data, 'base64'));
console.log('TABID:' + t.id);
