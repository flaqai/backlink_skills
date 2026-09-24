import { CDP, sleep } from './CDP.mjs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /teletype\.in/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await sleep(15000);
console.log('BODY:', await c.evalT("document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,12).join(' | ').slice(0,300)", 8000));
console.log('SPIN:', await c.evalT("JSON.stringify([...document.querySelectorAll('button')].filter(function(b){return b.offsetParent}).map(function(b){return b.className.slice(0,60)}))", 6000));
process.exit(0);
