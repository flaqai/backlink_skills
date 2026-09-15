import { CDP, sleep } from './CDP.mjs';
await (await fetch('http://127.0.0.1:9224/json/new?https://www.dreamwidth.org/create', { method: 'PUT' })).json();
await sleep(9000);
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const page = list.find(t => t.type === 'page' && /dreamwidth\.org/.test(t.url));
if (!page) { console.log('NO_TAB'); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable');
console.log('URL:', await c.evalT('location.href', 8000));
console.log('FORM_OK:', await c.evalT(`(() => { const u = document.querySelector('input[name=user]'); const e = document.querySelector('input[name=email]'); const p = document.querySelector('input[name=password1]'); const h = document.querySelector('.h-captcha'); return JSON.stringify({user: !!u, email: !!e, pass: !!p, hcaptcha: !!h}); })()`, 10000));
