import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// reg0000 0906 KeyCAPTCHA拼图拖拽: #puzzle块中心 -> 缺口中心, 多步插值
// 用法: node _reg0000_zen_drag.mjs <domain> <tx> <ty>
const [domain, txs, tys] = process.argv.slice(2);
const tx = parseInt(txs), ty = parseInt(tys);
const log = (...a) => console.log(...a);
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes(domain));
if (!tab) { log('NO_TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
// 当前块中心
const pos = await c.eval(`(function(){ const p=document.querySelector('#puzzle'); if(!p) return null; const b=p.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2),left:b.left,top:b.top}); })()`);
if (!pos) { log('NO_PUZZLE'); process.exit(1); }
const p = JSON.parse(pos);
log('PUZZLE_AT', p.x, p.y);
// 拖拽序列
const mv = (x, y) => c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left' });
await mv(p.x, p.y);
await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
const steps = 24;
for (let i = 1; i <= steps; i++) {
  const nx = Math.round(p.x + (tx - p.x) * i / steps);
  const ny = Math.round(p.y + (ty - p.y) * i / steps);
  await mv(nx, ny);
  await sleep(25);
}
await sleep(150);
await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: tx, y: ty, button: 'left', clickCount: 1 });
log('DROPPED_AT', tx, ty);
await sleep(3000);
// 拖后状态: puzzle新位置+validPuzzle+页面错误文本
const after = await c.eval(`(function(){ const p=document.querySelector('#puzzle'); const b=p?p.getBoundingClientRect():null; const v=document.querySelector('#validPuzzle'); const vb=v?v.getBoundingClientRect():null; const vs=v?v.getAttribute('style')||'':''; return JSON.stringify({puzzle:b?[Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)]:null, valid:vb?[Math.round(vb.x),Math.round(vb.y),Math.round(vb.width),Math.round(vb.height)]:null, validStyle:vs.slice(0,150), err:(document.body.innerText.match(/Puzzle[^\n]*/)||[''])[0]}); })()`);
log('AFTER:', after);
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/seoadminC/storage/_reg0000_zen_drag.png', Buffer.from(shot.data, 'base64'));
process.exit(0);
