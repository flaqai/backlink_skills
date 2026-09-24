import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(x => x.id === process.argv[2]);
const cdp = new CDP(new WebSocket(tab.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); cdp.ws.addEventListener('error', rej); });
await cdp.send('Page.enable');
await cdp.send('Page.navigate', { url: 'https://manifo.com/my-account' });
await sleep(7000);
const r = await cdp.eval(`(() => {
  const sites = [...document.querySelectorAll('a')].map(a => ({t: a.innerText.trim().slice(0,40), h: a.href})).filter(x => /preview|visit|edit\.|\.(manifo\.com|eu)/i.test(x.h + ' ' + x.t)).slice(0,8);
  const bodyHead = document.body.innerText.slice(0, 400);
  return JSON.stringify({sites, bodyHead});
})()`);
console.log('MYSITES:', r.slice(0, 900));
const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/backlink_skills/storage/_w1200_manifo_sites.png', Buffer.from(shot.data, 'base64'));
