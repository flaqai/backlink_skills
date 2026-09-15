import { CDP, sleep } from './CDP.mjs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('strikingly.com/templates'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await c.eval(`window.scrollTo(0,0); 'ok'`);
await sleep(800);
// 找 recaptcha challenge iframe 的位置
const fr = await c.eval(`(function(){
  const ifr=[...document.querySelectorAll('iframe')].map(f=>({src:(f.src||'').slice(0,60),x:f.getBoundingClientRect().x,y:f.getBoundingClientRect().y,w:f.getBoundingClientRect().width,h:f.getBoundingClientRect().height}));
  return JSON.stringify(ifr);
})()`);
console.log('iframes:', fr);
process.exit(0);
