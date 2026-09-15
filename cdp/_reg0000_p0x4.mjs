import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('publish0x'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
// 一次eval里取坐标并立刻点(防布局漂移): 直接用DOM focus代替坐标点击
await c.eval(`(function(){
  const pw=[...document.querySelectorAll('input')].filter(i=>i.offsetParent&&i.type==='password')[0];
  pw.focus(); pw.scrollIntoView({block:'center'}); return 'focused';
})()`);
await sleep(500);
// 焦点已在password, 直接打字
await c.send('Input.insertText',{text:'Xx@Pub0x26!Xm'});
await sleep(800);
const chk = await c.eval(`(function(){
  const pw=[...document.querySelectorAll('input')].filter(i=>i.offsetParent&&i.type==='password')[0];
  return 'pw_len='+pw.value.length;
})()`);
console.log(chk);
// Register
const rp = await c.eval(`(function(){
  const b=[...document.querySelectorAll('button')].find(x=>x.offsetParent&&(x.innerText||'').trim()==='Register');
  b.scrollIntoView({block:'center'}); const r=b.getBoundingClientRect();
  return JSON.stringify([Math.round(r.x+r.width/2),Math.round(r.y+r.height/2)]);
})()`);
const rp2=JSON.parse(rp);
await clickXY(rp2[0],rp2[1]);
await sleep(7000);
const st = await c.eval(`(function(){
  return JSON.stringify({url:location.href.slice(0,90), txt:document.body.innerText.slice(0,250)});
})()`);
console.log(st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_p0x-after2.png', Buffer.from(shot.data,'base64'));
process.exit(0);
