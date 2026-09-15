// _reg0000_ukitC.mjs — ukit 画布截图+现有文本块盘点 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /constructor/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable');
const shot = await c.send('Page.captureScreenshot', {format:'jpeg', quality:60});
(await import('fs')).writeFileSync('_reg0000_ukit_canvas.jpg', Buffer.from(shot.data, 'base64'));
const blocks = await c.evalT(`(() => {
  // 找画布里的文本块(iframe或同文档)
  const doc = document;
  const frames = [...doc.querySelectorAll('iframe')].map(f=>f.src.slice(0,80));
  const txt = doc.body.innerText.replace(/\s+/g,' ').slice(0,600);
  return JSON.stringify({frames, txt});
})()`, 12000);
console.log('BLOCKS:', typeof blocks === 'string' ? blocks : 'TIMEOUT');
ws.close();
