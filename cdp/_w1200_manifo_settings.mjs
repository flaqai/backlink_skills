// win1200: manifo /settings 补资料
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(x => x.id === process.argv[2]);
const cdp = new CDP(new WebSocket(tab.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); cdp.ws.addEventListener('error', rej); });
await cdp.send('Page.enable');
await cdp.send('Page.navigate', { url: 'https://manifo.com/settings' });
await sleep(7000);
const form = await cdp.eval(`(() => {
  const inp = [...document.querySelectorAll('input,textarea')].filter(i => i.offsetParent).map((i,ix) => ({ix, tag: i.tagName, type: i.type||'', name: i.name||'', id: i.id||'', val: String(i.value||'').slice(0,40), x: Math.round(i.getBoundingClientRect().x + i.getBoundingClientRect().width/2), y: Math.round(i.getBoundingClientRect().y + i.getBoundingClientRect().height/2)}));
  return JSON.stringify({url: location.href.slice(0,100), inp: inp.slice(0,15)});
})()`);
console.log('SETTINGS:', form.slice(0, 1200));
const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/backlink_skills/storage/_w1200_manifo_settings.png', Buffer.from(shot.data, 'base64'));
