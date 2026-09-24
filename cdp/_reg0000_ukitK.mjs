// _reg0000_ukitK.mjs — ukit 发布完成确认 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /constructor/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable');
await sleep(8000);
const st = await c.evalT(`(() => {
  const t = document.body.innerText.replace(/\s+/g,' ');
  return JSON.stringify({publishing: /publishing website/i.test(t), success: /congrat|success|published|is live/i.test(t), txt: t.slice(0,350)});
})()`, 10000);
console.log(typeof st === 'string' ? st : 'TIMEOUT');
const shot = await c.send('Page.captureScreenshot', {format:'jpeg', quality:60});
(await import('fs')).writeFileSync('_reg0000_ukit_pub4.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
