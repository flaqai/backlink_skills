import { CDP, sleep } from './CDP.mjs';
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.find(t => (t.url || '').includes('digabusiness') && t.type === 'page');
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
const d = await cdp.evalT(`(() => { const t = document.body.innerText; const i = t.search(/got your submission|awaiting approval|invalid|error|incorrect|already exist/i); return (i>=0 ? 'HIT: ' + t.slice(i, i+120) : 'NOHIT url=' + location.href + ' | ' + t.slice(0,200)); })()`, 8000);
console.log(d);
process.exit(0);
