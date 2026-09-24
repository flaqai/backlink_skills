// _reg0000_daP.mjs — Submit菜单→Journal (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && /deviantart\.com\/leoxm26/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(5000)]);
await c.send('Input.dispatchMouseEvent', {type:'mouseMoved', x:1268, y:27});
await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x:1268, y:27, button:'left', clickCount:1});
await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x:1268, y:27, button:'left', clickCount:1});
await sleep(2000);
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(8000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_daP.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
