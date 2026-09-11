// win1200: CF盾页截图诊断
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(x => x.id === process.argv[2]);
const cdp = new CDP(new WebSocket(tab.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); cdp.ws.addEventListener('error', rej); });
await sleep(6000);
await cdp.send('Page.enable');
const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/backlink_skills/storage/_w1200_bez_cf.png', Buffer.from(shot.data, 'base64'));
// 找turnstile iframe/checkbox
const r = await cdp.eval(`(() => {
  const ifr = [...document.querySelectorAll('iframe')].map(f => ({src: (f.src||'').slice(0,90), w: f.width, h: f.height, x: Math.round(f.getBoundingClientRect().x), y: Math.round(f.getBoundingClientRect().y)}));
  const inp = [...document.querySelectorAll('input')].map(i => ({type: i.type, x: Math.round(i.getBoundingClientRect().x), y: Math.round(i.getBoundingClientRect().y)}));
  return JSON.stringify({ifr, inp});
})()`);
console.log('WIDGETS:', r);
