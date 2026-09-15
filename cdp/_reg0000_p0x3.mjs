import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('publish0x'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
// 定位字段并真实打字
const pos = await c.eval(`(function(){
  const em=[...document.querySelectorAll('input')].find(i=>i.offsetParent&&i.type==='email');
  const pw=[...document.querySelectorAll('input')].filter(i=>i.offsetParent&&i.type==='password')[0];
  const reg=[...document.querySelectorAll('button')].find(b=>b.offsetParent&&(b.innerText||'').trim()==='Register');
  const g=e=>{e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return [Math.round(r.x+r.width/2),Math.round(r.y+r.height/2)];};
  return JSON.stringify({email:g(em),pass:g(pw),reg:reg?g(reg):null});
})()`);
console.log(pos);
const p=JSON.parse(pos);
await clickXY(p.email[0],p.email[1]); await sleep(600);
await c.send('Input.insertText',{text:'publish0x@92ng.com'}); await sleep(500);
await clickXY(p.pass[0],p.pass[1]); await sleep(600);
await c.send('Input.insertText',{text:'Xx@Pub0x26!Xm'}); await sleep(500);
// 等 Turnstile (最多15s)
let ts='?';
for(let i=0;i<8;i++){ await sleep(2000);
  ts = await c.eval(`(function(){ const f=[...document.querySelectorAll('iframe')].find(f=>(f.src||'').includes('turnstile')); if(!f) return 'no-iframe'; return 'present'; })()`);
  if(ts==='present') break;
}
console.log('turnstile:', ts);
await sleep(3000);
await clickXY(p.reg[0],p.reg[1]);
await sleep(6000);
const st = await c.eval(`document.body.innerText.slice(0,300)`);
console.log('after register:', st.slice(0,250));
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_p0x-after.png', Buffer.from(shot.data,'base64'));
process.exit(0);
