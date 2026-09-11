import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => (t.url || '').includes('poordirectory') && t.type === 'page');
const c = new CDP(new WebSocket(tab.webSocketDebuggerUrl));
await new Promise(r => c.ws.addEventListener('open', r));
await c.send('Page.enable');
await sleep(4000);
const st = await c.eval(`(() => {
  const tok = document.querySelector('#g-recaptcha-response');
  const t = document.body.innerText.toLowerCase();
  const keys = ['submitted','awaiting','approval','thank','error','required','already'];
  const hit = keys.find(k => t.includes(k));
  return JSON.stringify({tokenLen: tok ? String(tok.value.length) : '0', hit, msg: hit ? t.slice(Math.max(0,t.indexOf(hit)-50), t.indexOf(hit)+100).slice(0,160) : '', chalStill: !!document.querySelector('iframe[src*=bframe]')});
})()`);
console.log('STATE:', st);
const sh = await c.send('Page.captureScreenshot', { format: 'png' });
await fs.promises.writeFile('D:/Github/seoadminC/storage/_w12_pd_ch3.png', Buffer.from(sh.data, 'base64'));
