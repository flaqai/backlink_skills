import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('strikingly.com'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
await clickXY(540,1026); // checkbox在anchor框左侧
await sleep(6000);
const bf = await c.eval(`(function(){
  const big=[...document.querySelectorAll('iframe')].filter(f=>(f.src||'').includes('bframe')).find(f=>f.getBoundingClientRect().height>300);
  return big? JSON.stringify({y:Math.round(big.getBoundingClientRect().y),h:Math.round(big.getBoundingClientRect().height)}) : 'no-big-bframe';
})()`);
console.log('bframe:', bf);
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/seoadminC/storage/_stri-v2.png', Buffer.from(shot.data, 'base64'));
console.log('shot saved');
process.exit(0);
