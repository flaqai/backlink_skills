import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('strikingly.com'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
// 三个公交车格
const tiles = [[774,1055],[774,1187],[908,1187]];
for (const [x,y] of tiles) { await clickXY(x,y); await sleep(1500); }
// 验证按钮
await clickXY(916,1286);
await sleep(8000);
const st = await c.eval(`(function(){
  const big=[...document.querySelectorAll('iframe')].filter(f=>(f.src||'').includes('bframe')).find(f=>f.getBoundingClientRect().height>300);
  const anchor=[...document.querySelectorAll('iframe')].find(f=>(f.src||'').includes('anchor'));
  return JSON.stringify({url:location.href.slice(0,80), challengeStill: big? 'open':'closed', anchorVisible: anchor? !!anchor.offsetParent : false});
})()`);
console.log(st);
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/seoadminC/storage/_stri-after.png', Buffer.from(shot.data, 'base64'));
console.log('shot saved');
process.exit(0);
