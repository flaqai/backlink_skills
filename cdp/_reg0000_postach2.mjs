import { CDP } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const page = list.find(t => t.type === 'page' && /postach\.io/.test(t.url));
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable');
const out = await c.evalT(`JSON.stringify([...document.querySelectorAll('a')].filter(a => (a.innerText||'').toLowerCase().indexOf('sign') >= 0 || (a.href||'').indexOf('signup') >= 0 || (a.href||'').indexOf('login') >= 0).map(a => ({txt: (a.innerText||'').trim().slice(0,20), href: (a.href||'').slice(0,70)})).slice(0,6))`, 8000);
console.log('SIGNUP_LINKS:', out);
