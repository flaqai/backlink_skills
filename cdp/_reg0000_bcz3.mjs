import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('bcz.com'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
const fill = async (name, val) => {
  const v = JSON.stringify(val);
  return await c.eval(`(function(){
    const i=document.querySelector('input[name=${JSON.stringify(name)}]');
    if(!i) return 'nf';
    const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
    setter.call(i, ${v});
    i.dispatchEvent(new Event('input',{bubbles:true}));
    i.dispatchEvent(new Event('change',{bubbles:true}));
    return 'ok';
  })()`);
};
console.log('email:', await fill('user_email','bcz@92ng.com'));
console.log('pass:', await fill('user_pass','Xx@Bcz26!Xm'));
console.log('conf:', await fill('user_pass_conf','Xx@Bcz26!Xm'));
// 勾agree
const ag = await c.eval(`(function(){
  const a=document.querySelector('input[name=agree_terms]');
  if(!a) return 'nf';
  if(!a.checked){ a.click(); }
  return a.checked;
})()`);
console.log('agree:', ag);
await sleep(800);
// 点hCaptcha checkbox
await clickXY(546,595);
await sleep(6000);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_bcz-cap.png', Buffer.from(shot.data,'base64'));
console.log('captcha shot saved');
process.exit(0);
