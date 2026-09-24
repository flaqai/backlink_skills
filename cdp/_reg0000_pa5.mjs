import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// postach: click "下一个" (next) inside captcha, then screenshot for next challenge page
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('postach.io'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable');
const x = parseInt(process.argv[2]), y = parseInt(process.argv[3]);
// move-hover-press-release with small dwell (reg2200 lesson: hover dwell before click)
await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});
await sleep(300);
await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});
await sleep(120);
await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});
console.log('clicked next', x, y);
await sleep(4000);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/pa_page2.png', Buffer.from(shot.data,'base64'));
process.exit(0);
