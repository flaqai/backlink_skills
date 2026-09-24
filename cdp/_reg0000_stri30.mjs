import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('strikingly.com'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(7000);
const st = await c.eval(`(function(){
  const ifr=[...document.querySelectorAll('iframe')].map(f=>({src:(f.src||'').slice(0,80),w:f.getBoundingClientRect().width,h:f.getBoundingClientRect().height}));
  const ce=[...document.querySelectorAll('[contenteditable=true]')].map(e=>({ph:e.getAttribute('placeholder')||e.dataset.placeholder||'', cls:String(e.className).slice(0,40), x:Math.round(e.getBoundingClientRect().x), y:Math.round(e.getBoundingClientRect().y)}));
  const btns=[...document.querySelectorAll('button, a')].filter(b=>b.offsetParent).map(b=>(b.innerText||'').trim()).filter(t=>t&&t.length<18);
  return JSON.stringify({url:location.href.slice(0,110), ifr:ifr.slice(0,6), ce, btns:[...new Set(btns)].slice(0,20)});
})()`);
console.log(st.slice(0,1200));
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/seoadminC/storage/_stri-postedit2.png', Buffer.from(shot.data, 'base64'));
process.exit(0);
