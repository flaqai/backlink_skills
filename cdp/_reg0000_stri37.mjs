import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('blogPosts'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
await clickXY(400,500); // 点空白关设置面板
await sleep(1200);
await clickXY(124,120); // 发布
await sleep(3000);
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/seoadminC/storage/_stri-pub.png', Buffer.from(shot.data, 'base64'));
const st = await c.eval(`document.body.innerText.slice(0,300)`);
console.log(st.slice(0,250));
process.exit(0);
