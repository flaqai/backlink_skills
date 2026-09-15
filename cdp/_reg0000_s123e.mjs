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
    i.focus(); i.scrollIntoView({block:'center'});
    const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
    setter.call(i, ${JSON.stringify(val)});
    i.dispatchEvent(new Event('input',{bubbles:true}));
    i.dispatchEvent(new Event('change',{bubbles:true}));
    return 'ok';
  })()`);
};
console.log('type:', await fillByName('businessType','Personal Blog'));
console.log('name:', await fillByName('websiteName',"Leo's Notebook"));
await sleep(600);
const nb = await c.eval(`(function(){
  const b=[...document.querySelectorAll('input[type=submit],button')].find(e=>e.offsetParent&&(e.innerText||e.value||'').includes('Next'));
  if(!b) return null; const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});
})()`);
console.log('next:', nb);
if(nb){const p=JSON.parse(nb); await clickXY(p.x,p.y);}
await sleep(5000);
const st = await c.eval(`(function(){
  const inputs=[...document.querySelectorAll('input,button')].filter(i=>i.offsetParent).map(i=>({t:i.type||i.tagName,n:i.name||'',ph:(i.placeholder||'').slice(0,28),txt:(i.innerText||'').trim().slice(0,18)}));
  return JSON.stringify({step:document.body.innerText.match(/Step \d/)?.[0], inputs:inputs.slice(0,14)});
})()`);
console.log(st);
process.exit(0);
