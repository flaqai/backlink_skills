import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('site123'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const r = await c.eval(`(function(){
  const i=document.querySelector('input[name=email]');
  const f=i? i.closest('form') : null;
  if(!f) return 'NO-FORM';
  const btn=[...f.querySelectorAll('button,input[type=submit]')].map(b=>({t:b.tagName,v:(b.value||b.innerText||'').trim().slice(0,25),dis:b.disabled}));
  if(typeof f.requestSubmit==='function'){ f.requestSubmit(); return JSON.stringify({submitted:true, btns:btn.slice(0,4)}); }
  f.submit(); return JSON.stringify({submitted:'submit()', btns:btn.slice(0,4)});
})()`);
console.log(r);
await sleep(9000);
const st = await c.eval(`(function(){
  return JSON.stringify({url:location.href.slice(0,100), txt:document.body.innerText.slice(0,200)});
})()`);
console.log(st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_s123-s5.png', Buffer.from(shot.data,'base64'));
process.exit(0);
