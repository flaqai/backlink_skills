import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('publish0x'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const st = await c.eval(`(function(){
  const ifr=[...document.querySelectorAll('iframe')].map(f=>(f.src||'').slice(0,80));
  const cf=[...document.querySelectorAll('[class*=turnstile], [class*=cf-], .cf-turnstile')].map(e=>({cls:e.className, html:e.outerHTML.slice(0,150)}));
  const input=[...document.querySelectorAll('input[name*=cf], input[name*=turnstile]')].map(i=>({n:i.name,v:(i.value||'').slice(0,30)}));
  return JSON.stringify({iframes:ifr, cfDiv:cf, tokenInput:input});
})()`);
console.log(st.slice(0,900));
process.exit(0);
