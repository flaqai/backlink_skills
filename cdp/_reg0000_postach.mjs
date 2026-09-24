import { CDP, sleep } from './CDP.mjs';
await (await fetch('http://127.0.0.1:9224/json/new?https://postach.io/', { method: 'PUT' })).json();
await sleep(9000);
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const page = list.find(t => t.type === 'page' && /postach\.io/.test(t.url));
if (!page) { console.log('NO_TAB'); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable');
console.log('TITLE:', await c.evalT('document.title', 10000));
console.log('URL:', await c.evalT('location.href', 6000));
console.log('BODY:', (await c.evalT('(document.body.innerText||"").replace(/\n+/g," | ").slice(0,250)', 8000)));
console.log('SIGNUP:', await c.evalT(`JSON.stringify([...document.querySelectorAll('a')].filter(a=>/sign.?up|register|get started|login/i.test((a.innerText||'')+a.href)).map(a=>({txt:(a.innerText||'').trim().slice(0,20),href:a.href.slice(0,70)})).slice(0,6)))`, 8000));
