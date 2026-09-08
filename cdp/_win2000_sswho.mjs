import { CDP, sleep } from './CDP.mjs';
const base = 'http://127.0.0.1:9224';
let tabs = await (await fetch(base+'/json/list')).json();
let tab = tabs.find(t => t.type==='page' && t.url.includes('substack'));
if(!tab){ const r = await fetch(base+'/json/new?https://substack.com/',{method:'PUT'}); tab = await r.json(); await fetch(base+'/json/activate/'+tab.id); await sleep(6000); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
const c = new CDP(ws);
await c.send('Page.enable');
await c.send('Page.navigate',{url:'https://substack.com/account/account'});
await sleep(8000);
const out = await c.evalT("(function(){var t=document.body.innerText;return location.href.slice(0,60)+'<<>>'+t.slice(0,300).split(String.fromCharCode(10)).join('~');})()", 10000);
console.log(out);
process.exit(0);
