import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('inube.com/register'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
const click = async (x,y) => { await ev('mouseMoved',{x,y}); await sleep(150); await ev('mousePressed',{x,y,button:'left',clickCount:1}); await sleep(100); await ev('mouseReleased',{x,y,button:'left',clickCount:1}); await sleep(700); };
await click(518,400); // 补选 r2c1
await click(794,679); // 下一个
await sleep(3500);
const s = await c.send('Page.captureScreenshot', {format:'png'}).catch(()=>null);
if(s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/inube_r3.png', Buffer.from(s.data,'base64'));
console.log('next round, shot');
