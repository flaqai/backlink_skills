import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('site123'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
const fillByName = async (name, val) => {
  return await c.eval(`(function(){
    const i=document.querySelector('input[name=${JSON.stringify(name)}]');
    if(!i) return 'nf';
    i.focus();
    const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
    setter.call(i, ${JSON.stringify(val)});
    i.dispatchEvent(new Event('input',{bubbles:true}));
    i.dispatchEvent(new Event('change',{bubbles:true}));
    return 'ok';
  })()`);
};
console.log('name:', await fillByName('name','Leo Xm'));
console.log('email:', await fillByName('email','site123@92ng.com'));
console.log('pass:', await fillByName('password','Xx@S12326!Xm'));
await sleep(1000);
const sb = await c.eval(`(function(){
  const b=[...document.querySelectorAll('input[type=submit],button')].find(e=>e.offsetParent&&(e.innerText||e.value||'').includes('Start my website'));
  if(!b) return null; const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});
})()`);
console.log('submit:', sb);
if(sb){const p=JSON.parse(sb); await clickXY(p.x,p.y);}
await sleep(9000);
const st = await c.eval(`(function(){
  return JSON.stringify({url:location.href.slice(0,100), txt:document.body.innerText.slice(0,250)});
})()`);
console.log(st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_s123-s3.png', Buffer.from(shot.data,'base64'));
process.exit(0);
