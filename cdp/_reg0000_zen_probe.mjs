import { CDP, sleep } from './CDP.mjs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /thezenweb/.test(t.url));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const out = await c.eval(`(function(){
  const ifr = [...document.querySelectorAll('iframe')].map(f=>({src:(f.src||'').slice(0,60), x:Math.round(f.getBoundingClientRect().x), y:Math.round(f.getBoundingClientRect().y), w:Math.round(f.getBoundingClientRect().width), h:Math.round(f.getBoundingClientRect().height)}));
  // 主文档里找 keycaptcha 相关元素
  const kd = [...document.querySelectorAll('[id*=cap],[class*=cap],[id*=puzzle]')].map(e=>({tag:e.tagName, id:(e.id||'').slice(0,30), cls:(e.className||'').toString().slice(0,40), r:(()=>{const b=e.getBoundingClientRect(); return [Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)];})()}));
  return JSON.stringify({iframes:ifr, els:kd, dpr:window.devicePixelRatio, vw:innerWidth, vh:innerHeight});
})()`);
console.log(out);
process.exit(0);
