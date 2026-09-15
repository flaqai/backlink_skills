import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('writeablog.net'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable');
const st = await c.evalT(`(function(){ const g=document.querySelector('.g-recaptcha'); const ifr=[...document.querySelectorAll('iframe')].map(x=>({s:(x.src||'').slice(0,60),w:x.offsetWidth,h:x.offsetHeight})); return JSON.stringify({grecaptcha: typeof grecaptcha, widget: g?{html:g.innerHTML.slice(0,100), h:g.offsetHeight, w:g.offsetWidth}:null, iframes:ifr, geo:typeof window.___grecaptcha_cfg}); })()`, 10000);
console.log(st);
process.exit(0);
