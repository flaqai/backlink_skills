// win1200: blogminds edit.php 找 #188 文章 permalink
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await fetch(`http://127.0.0.1:9224/json/activate/${t.id}`);
const cdp = new CDP(new WebSocket(t.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); cdp.ws.addEventListener('error', rej); });
await cdp.send('Page.enable');
await cdp.send('Page.navigate', { url: 'https://blogminds.com/edit.php' });
await sleep(12000);
const r = await cdp.eval(`(() => JSON.stringify({
  url: location.href.slice(0, 130),
  title: document.title.slice(0, 50),
  cfBlocked: /Attention Required|Cloudflare|请稍候|安全验证/i.test(document.body.innerText.slice(0,400)),
  head: document.body.innerText.slice(0, 300)
}))()`);
console.log('EDIT.PHP:', r);
const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/backlink_skills/storage/_w1200_bm_edit.png', Buffer.from(shot.data, 'base64'));
console.log('TABID:' + t.id);
