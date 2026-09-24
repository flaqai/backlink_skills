import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('bcz.com'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
// 悬停0.8s再按
await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:1039,y:779});
await sleep(800);
await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x:1039,y:779,button:'left',clickCount:1});
await sleep(120);
await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:1039,y:779,button:'left',clickCount:1});
await sleep(5000);
const shot1 = await c.send('Page.captureScreenshot', {format:'png', clip:{x:575,y:730,width:490,height:80,scale:1.5}});
writeFileSync('D:/Github/seoadminC/storage/_bcz-btn.png', Buffer.from(shot1.data,'base64'));
// 全页也来一张
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_bcz-cap5.png', Buffer.from(shot.data,'base64'));
console.log('done');
process.exit(0);
