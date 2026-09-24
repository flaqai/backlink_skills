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
await sleep(1500);
console.log('fill title:', await fill('blog_title', "Leo's Notebook"));
console.log('fill blogname:', await fill('blogname', 'leoxm26'));
await sleep(800);
const state1 = await c.eval(`JSON.stringify({step:(location.href.match(/step=([a-z]+)/i)||[])[1], vals:[...document.querySelectorAll('input')].filter(i=>i.offsetParent&&i.value).map(i=>i.name+'='+i.value.slice(0,30))})`);
console.log('state:', state1);
const nx = await c.eval(`(function(){
  const b=[...document.querySelectorAll('button, input[type=submit], input[type=button]')].find(e=>e.offsetParent && /next|continue|submit/i.test(e.innerText||e.value||''));
  if(!b) return 'nf'; const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});
})()`);
console.log('next:', nx);
if (nx.startsWith('{')) { const o=JSON.parse(nx); await clickXY(o.x,o.y); }
await sleep(4000);
const state2 = await c.eval(`JSON.stringify({step:(location.href.match(/step=([a-z]+)/i)||[])[1], inputs:[...document.querySelectorAll('input')].filter(e=>e.offsetParent).map(e=>({t:e.type,n:e.name})).slice(0,14)})`);
console.log('after:', state2);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_bcz-s1.png', Buffer.from(shot.data,'base64'));
process.exit(0);
