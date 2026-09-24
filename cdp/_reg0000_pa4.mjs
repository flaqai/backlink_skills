import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// postach: click the elephant (highest jumper) inside captcha iframe, then screenshot result
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('postach.io'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable');
// quick frame to locate elephant right now (challenge iframe at page x=423,y=119, 520x570)
const shot0 = await c.send('Page.captureScreenshot', {format:'png', clip:{x:423,y:119,width:520,height:400,scale:1}});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/pa_pre.png', Buffer.from(shot0.data,'base64'));
// click at given page coords (elephant ground position from f4)
const x = parseInt(process.argv[2] || '683'), y = parseInt(process.argv[3] || '449');
await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});
await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});
await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});
console.log('clicked', x, y);
await sleep(4000);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/pa_after.png', Buffer.from(shot.data,'base64'));
console.log('done');
process.exit(0);
