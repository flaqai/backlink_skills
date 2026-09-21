// 使用重置券：POST /api/biz/customer-package-reset/use
// 用法：node bm-voucher-use.mjs          → 真正使用
//       node bm-voucher-use.mjs --dry    → 只预检与组装载荷，不 POST
// 前置：9227 专属保活 Chrome（额度管家专属实例，登录态自持）有 bigmodel.cn tab；
//       不在线先经 schtasks bm-9227-heal 以 Administrator 拉起（DPAPI 身份稳定）再找
const DRY = process.argv.includes('--dry');

let page = null;
for (const port of [9227]) {
  try {
    const l = await (await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(2500) })).json();
    const p = l.find(t => t.type === 'page' && /bigmodel\.cn/.test(t.url));
    if (p) { page = p; console.log('USE_PORT ' + port); break; }
    const { execSync } = await import('child_process');
    execSync('schtasks /run /tn bm-9227-heal', { timeout: 40000, stdio: 'pipe' });
    await new Promise(r => setTimeout(r, 8000));
    const l2 = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    const p2 = l2.find(t => t.type === 'page' && /bigmodel\.cn/.test(t.url));
    if (p2) { page = p2; console.log('USE_PORT ' + port); break; }
  } catch (e) {}
}
if (!page) { console.log('NO_TAB'); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); setTimeout(rej, 8000); });
let id = 0; const pending = new Map();
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { const { resolve, reject } = pending.get(m.id); pending.delete(m.id); m.error ? reject(new Error(m.error.message)) : resolve(m.result); }
});
const evalp = (expression) => new Promise((resolve, reject) => {
  const i = ++id; pending.set(i, { resolve, reject });
  ws.send(JSON.stringify({ id: i, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true } }));
});

const out = (await evalp(`(async () => {
  const getCookie = (n) => (document.cookie.match(new RegExp('(?:^|;\\\\s*)' + n + '=([^;]*)')) || [])[1] || '';
  const token = getCookie('bigmodel_token_production');
  if (!token) return JSON.stringify({ err: 'NO_TOKEN' });
  const H = { Authorization: 'Bearer ' + decodeURIComponent(token), 'Content-Type': 'application/json' };
  const uuid = () => crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxxyxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); }) + Date.now();

  // 1) 预检：券库存与有效期（多张时按到期时间升序，最短寿命的先用）
  const list = await (await fetch('/api/biz/customer-package-reset/list?targetType=PERSONAL', { credentials: 'include', headers: H })).json();
  const recs = (list.data && list.data.fiveHourResets || [])
    .filter(r => r.available)
    .sort((a, b) => new Date(String(a.expireTime).replace(' ', 'T')) - new Date(String(b.expireTime).replace(' ', 'T')));
  if (!recs.length) return JSON.stringify({ err: 'NO_VOUCHER', raw: JSON.stringify(list.data && list.data.fiveHourResets || []) });
  const rec = recs[0];
  const payload = { targetType: 'PERSONAL', resetType: 'FIVE_HOUR', recordId: rec.recordId, requestId: uuid() };
  if (${DRY ? 'true' : 'false'}) return JSON.stringify({ dry: true, payload, expireTime: rec.expireTime });

  // 2) 使用
  const use = await (await fetch('/api/biz/customer-package-reset/use', {
    method: 'POST', credentials: 'include', headers: H, body: JSON.stringify(payload)
  })).json();

  // 3) 复核：额度应回落、lastFiveHourResetTime 应更新
  const limit = await (await fetch('/api/monitor/usage/quota/limit', { credentials: 'include', headers: H })).json();
  const five = (limit.data.limits || []).find(x => x.type === 'TOKENS_LIMIT');
  const nr = five && five.nextResetTime;
  const nrStr = nr ? new Date(typeof nr === 'number' ? nr : String(nr).replace(' ', 'T')).toLocaleString('zh-CN') : null;
  return JSON.stringify({ use, after: { pct: five && five.percentage, nextReset: nrStr } });
})()`)).result.value;

console.log(out);
ws.close();
