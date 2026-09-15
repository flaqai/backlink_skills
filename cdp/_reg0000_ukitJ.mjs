// _reg0000_ukitJ.mjs — ukit 真实鼠标点侧栏Publish (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /constructor/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable');
await c.send('Input.dispatchMouseEvent', {type:'mouseMoved', x:24, y:781});
await sleep(800);
await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x:24, y:781, button:'left', clickCount:1});
await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x:24, y:781, button:'left', clickCount:1});
await sleep(4000);
const dlg = await c.evalT(`(() => {
  const t = document.body.innerText.replace(/\s+/g,' ');
  return JSON.stringify({hasPublishDialog: /publish site|your site|domain|subdomain|confirm/i.test(t) && /publish/i.test(t), txt: t.slice(0,500)});
})()`, 10000);
console.log(typeof dlg === 'string' ? dlg : 'TIMEOUT');
const shot = await c.send('Page.captureScreenshot', {format:'jpeg', quality:60});
(await import('fs')).writeFileSync('_reg0000_ukit_pub3.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
