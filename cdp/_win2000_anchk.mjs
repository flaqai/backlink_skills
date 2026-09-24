// _win2000_anchk.mjs: 线上锚链核查 <url> <needle> (raw ws)
import { sleep } from './CDP.mjs';
const [url, needle] = process.argv.slice(2);
const info = await (await fetch(`http://127.0.0.1:9224/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(info.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); setTimeout(() => rej(new Error('ws超时')), 8000); });
let id = 0; const pending = new Map();
ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result || {}); pending.delete(m.id); } });
const send = (method, params = {}) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params })); return new Promise((res) => pending.set(i, res)); };
const evalExpr = async (expr, ms = 12000) => {
  const r = await Promise.race([ send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }),
    new Promise((res) => setTimeout(() => res({ timeout: 1 }), ms)) ]);
  if (r.timeout) return 'TIMEOUT';
  return r.result?.value === undefined ? '' : r.result.value;
};
await send('Page.enable');
await send('Target.activateTarget', { targetId: info.id });
await send('Page.navigate', { url });
await sleep(9000);
const res = await evalExpr(`(() => {
  const links = [...document.querySelectorAll('a[href]')].map(a => a.href);
  const hits = links.filter(h => h.includes(${JSON.stringify(needle)}));
  return JSON.stringify({ total: links.length, hitCount: hits.length, hits: hits.slice(0,5), title: document.title.slice(0,80) });
})()`);
console.log(res);
await fetch(`http://127.0.0.1:9224/json/close/${info.id}`).catch(() => {});
process.exit(0);
