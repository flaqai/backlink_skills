// _win2000_wtab.mjs: 开 wp-admin post-new 页并报状态 <wp-admin-url>
import { sleep } from './CDP.mjs';
const url = process.argv[2];
const info = await (await fetch(`http://127.0.0.1:9224/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(info.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); setTimeout(() => rej(new Error('ws超时')), 8000); });
let id = 0; const pending = new Map();
ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result || {}); pending.delete(m.id); } });
const send = (method, params = {}) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params })); return new Promise((res) => pending.set(i, res)); };
const evalExpr = async (expr, ms = 10000) => {
  const r = await Promise.race([ send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }),
    new Promise((res) => setTimeout(() => res({ timeout: 1 }), ms)) ]);
  if (r.timeout) return 'TIMEOUT';
  return r.result?.value === undefined ? '' : r.result.value;
};
await send('Target.activateTarget', { targetId: info.id });
await send('Page.enable');
await send('Page.navigate', { url });
await sleep(12000);
const st = await evalExpr(`JSON.stringify({ url: location.href.slice(0,100), hasCanvas: !!([...document.querySelectorAll('iframe')].find(f => (f.title||'') === 'Editor canvas')), titleInput: !!document.querySelector('h1.wp-block-post-title,.editor-post-title__input'), text: document.body.innerText.replace(/\s+/g,' ').slice(0,150) })`);
console.log(st);
console.log('TABID:' + info.id);
