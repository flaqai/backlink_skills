import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('inube.com/register'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
const click = async (x,y) => { await ev('mouseMoved',{x,y}); await sleep(120); await ev('mousePressed',{x,y,button:'left',clickCount:1}); await sleep(80); await ev('mouseReleased',{x,y,button:'left',clickCount:1}); await sleep(450); };
await click(437,417); // checkbox
await sleep(3500);
const s = await c.send('Page.captureScreenshot', {format:'jpeg', quality:80}).catch(()=>null);
if(s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/inube_f1.jpg', Buffer.from(s.data,'base64'));
console.log('fast shot 1');
