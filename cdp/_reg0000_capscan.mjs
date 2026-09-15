import { CDP, sleep } from './CDP.mjs';
const dom = process.argv[2];
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes(dom));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const c = new CDP(ws);
await c.send('Page.enable');
const r = await c.eval(`JSON.stringify({
  iframes: [...document.querySelectorAll('iframe')].map(f=>({src:(f.src||'').slice(0,100), vis:!!f.offsetParent})),
  caps: [...document.querySelectorAll('[class*=aptcha],[id*=aptcha],[class*=turnstile],[class*=cf-chl]')].map(x=>({tag:x.tagName, id:x.id, cls:(x.className||'').toString().slice(0,60), vis:!!x.offsetParent, html:x.outerHTML.slice(0,180)})),
  inputs: [...document.querySelectorAll('input,button')].map(i=>({n:i.name,id:i.id,ty:i.type,vis:!!i.offsetParent}))
})`).catch(e=>'ERR:'+e.message.slice(0,150));
console.log(r);
ws.close(); process.exit(0);
