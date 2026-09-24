import { CDP, sleep } from './CDP.mjs';
const [,, domain] = process.argv;
const base = 'http://127.0.0.1:9224';
const tabs = await (await fetch(base+'/json/list')).json();
const tab = tabs.find(t => t.type==='page' && t.url.includes(domain));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
const c = new CDP(ws);
await c.send('Page.enable');
// 关掉Quick Edit
await c.eval("(function(){var b=[...document.querySelectorAll('button,a,input')].find(function(x){return /^(Cancel|Close)$/.test((x.innerText||x.value||'').trim())&&x.offsetParent});if(b)b.click();})()");
await sleep(1500);
const out = await c.eval("(function(){var N=String.fromCharCode(10);var rows=[...document.querySelectorAll('tr')].map(function(r){var a=[...r.querySelectorAll('a')].filter(function(x){return /edit-post|blog-ezine/.test(x.href)&&!/#/.test(x.href)});return (r.innerText.split(N).join('~').replace(/~+/g,'~').slice(0,100))+' ||'+(a.length?a.map(function(x){return x.href}).join(' , '):'none');});return rows.join(N);})()");
console.log(out);
process.exit(0);
