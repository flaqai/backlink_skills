// 注入cookie到当前substack tab: node _win2000_ckuse.mjs <cookieFile> <domain> <gotoUrl>
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const [,, ckFile, dom, gotoUrl] = process.argv;
const base = 'http://127.0.0.1:9224';
let tabs = await (await fetch(base+'/json/list')).json();
let tab = tabs.find(t => t.type==='page' && t.url.includes(dom.replace('.com','')));
if(!tab){ const r = await fetch(base+'/json/new?about:blank',{method:'PUT'}); tab = await r.json(); await fetch(base+'/json/activate/'+tab.id); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Network.enable');
const ck = JSON.parse(fs.readFileSync(ckFile,'utf8'));
let n=0;
for(const k of ck.cookies){
  try { await c.send('Network.setCookie', {name:k.name, value:k.value, domain:k.domain||dom, path:k.path||'/', secure: k.secure!==false, httpOnly: !!k.httpOnly}); n++; } catch(e){}
}
console.log('cookies set:', n);
await c.send('Page.navigate',{url: gotoUrl || ('https://'+dom+'/')});
await sleep(9000);
const out = await c.evalT("(function(){var t=document.body.innerText;return location.href.slice(0,70)+'<<>>'+t.slice(0,200).split(String.fromCharCode(10)).join('~');})()", 10000);
console.log(out);
process.exit(0);
