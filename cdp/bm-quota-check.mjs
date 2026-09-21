// 定时检查 v7（2026-09-21 额度管家改造）：
//  - 端口只走 [9227]：专属保活 Chrome（独立 user-data-dir + --proxy-server=direct:// 直连不走
//    airtcp 系统代理，防账号 IP 漂移），登录态由该实例 profile 自持（cookie 自持登录，2026-09-21
//    用户定稿：不再从插件/外部导入）。旧 9226 监控实例+存档注入通道退役。
//  - API 直读（v4 起）：页面上下文用 bigmodel_token_production cookie 作 Bearer 重放
//    /api/monitor/usage/quota/limit → TOKENS_LIMIT.percentage/nextResetTime
//    /api/biz/customer-package-reset/list → fiveHourResets/weekResets 券库存（v6 起
//    周额度券单独成字段带回；2026-09-18 修复页面恒报无券）
const URL = 'https://www.bigmodel.cn/coding-plan/personal/usage';
const fs = await import('fs');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const READ = `(async () => {
  const getCookie = (n) => (document.cookie.match(new RegExp('(?:^|;\\\\s*)' + n + '=([^;]*)')) || [])[1] || '';
  const token = getCookie('bigmodel_token_production');
  if (!token) return { err: 'NO_TOKEN' };
  const H = { Authorization: 'Bearer ' + decodeURIComponent(token) };
  const gj = async (u) => {
    const resp = await fetch(u, { credentials: 'include', headers: H });
    const txt = await resp.text();
    // 2026-09-10 诊断增强：token 被服务端踢进悬挂态时端点返回 200+空体（普通过期是
    // 200+401 JSON，网络错误是 fetch reject）——单独定性，bm-watch.log 一眼可辨，
    // 处置动作=重新登录 bigmodel.cn 后在插件点「保存并同步」。
    if (!txt.trim()) return { __empty: true, status: resp.status };
    try { return JSON.parse(txt); } catch (e) { return { __badjson: true, status: resp.status, head: txt.slice(0, 120) }; }
  };
  const pad = (x) => String(x).padStart(2, '0');
  try {
    const limit = await gj('/api/monitor/usage/quota/limit');
    if (limit.__empty) return { err: 'TOKEN_SOFT_REJECTED', status: limit.status, hint: '200空体=token被服务端悬挂，请重登bigmodel.cn并重新保存同步' };
    if (limit.__badjson) return { err: 'API_BADJSON', status: limit.status, head: limit.head };
    const resets = await gj('/api/biz/customer-package-reset/list?targetType=PERSONAL');
    if (!limit.success) return { err: 'API_LIMIT_FAIL', msg: limit.msg };
    // 2026-09-18：券列表接口失败时原逻辑静默当 0 券（vouchers=[]）——正是「页面无券、实际有券」
    // 这类读取事故的源头之一，改为显式失败，走 READ_FAIL 落截图下轮重试
    if (!resets.success) return { err: 'API_RESETS_FAIL', msg: resets.msg };
    const fiveHour = (limit.data.limits || []).find(x => x.type === 'TOKENS_LIMIT');
    if (!fiveHour) return { err: 'NO_TOKENS_LIMIT', raw: JSON.stringify(limit.data).slice(0, 300) };
    const resetDate = new Date(fiveHour.nextResetTime);
    // bigmodel 规则（2026-08-26 用户实测）：下个重置时间 = 刷新后第一个 token 被使用后的 5 小时；
    // 刷新后一直不用 token 则 nextResetTime 恒为空。无效时输出 null（不产出 NaN:NaN），等有消耗后自然带回。
    const resetOk = resetDate instanceof Date && !isNaN(resetDate.getTime());
    const now = new Date();
    const vouchers = (resets.data && resets.data.fiveHourResets) || [];
    const avail = vouchers.filter(v => v.available)
      .sort((a, b) => new Date(String(a.expireTime).replace(' ', 'T')) - new Date(String(b.expireTime).replace(' ', 'T'))); // 到期升序：最短寿命优先
    const v0 = avail[0] || null;
    // 2026-09-18 修复「重置券读取」：weekResets（周额度券）此前被整段忽略——bigmodel 页面
    // 「重置管理」把它计入有券，本链路却恒报无券。单独成字段随采样带回；5h 字段口径刻意
    // 不动（cutoff/休眠/用券决策只认 5h 券，周券救不了 5h 窗口，混入会让熔断失效）
    const weekVouchers = (resets.data && resets.data.weekResets) || [];
    const weekAvail = weekVouchers.filter(v => v.available)
      .sort((a, b) => new Date(String(a.expireTime).replace(' ', 'T')) - new Date(String(b.expireTime).replace(' ', 'T')));
    const w0 = weekAvail[0] || null;
    return {
      pct: fiveHour.percentage,
      hasBtn: avail.length > 0,            // 可用券>0（2026-09-01 修正：原 vouchers.length>0 会把已过期/已用的历史券记录也判成有券，页面显示与实际不符）
      voucherCount: avail.length,
      voucherRecordId: v0 ? v0.recordId : null,
      voucherExpireAt: v0 ? v0.expireTime : null,                                    // 最早到期时间原串 "Y-m-d H:i:s"
      voucherExpireEpoch: v0 ? new Date(String(v0.expireTime).replace(' ', 'T')).getTime() : null, // 券到期 ms
      weekVoucherCount: weekAvail.length,
      weekVoucherExpireAt: w0 ? w0.expireTime : null,
      weekVoucherExpireEpoch: w0 ? new Date(String(w0.expireTime).replace(' ', 'T')).getTime() : null,
      resetEpoch: resetOk ? fiveHour.nextResetTime : null, // 5小时窗口自然重置时间（ms 时间戳，供剩余时长计算；无效时 null）
      resetTime: resetOk ? '重置时间：' + pad(resetDate.getHours()) + ':' + pad(resetDate.getMinutes()) : null,
      refreshedAt: '最近刷新时间：' + now.getFullYear() + '.' + pad(now.getMonth() + 1) + '.' + pad(now.getDate()) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()),
    };
  } catch (e) { return { err: 'FETCH_ERR', msg: String(e).slice(0, 200) }; }
})()`;

// 单端口完整采样：找到（或打开）bigmodel tab → 连 CDP → READ → 读 cookie 到期 → 关 ws。
// 返回 { port, r }；端口不通/无 tab 返回 null。
async function readPort(port) {
  let page;
  try {
    const l = await (await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(2500) })).json();
    page = l.find(t => t.type === 'page' && /bigmodel\.cn/.test(t.url));
    if (!page) {
      await fetch(`http://127.0.0.1:${port}/json/new?` + encodeURIComponent(URL), { method: 'PUT', signal: AbortSignal.timeout(4000) });
      await sleep(5000);
      const l2 = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      page = l2.find(t => t.type === 'page' && /bigmodel\.cn/.test(t.url));
    }
  } catch (e) { return null; }
  if (!page) return null;

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  try {
    await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); setTimeout(rej, 8000); });
  } catch (e) { return null; }
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const { resolve, reject } = pending.get(m.id); pending.delete(m.id); m.error ? reject(new Error(m.error.message)) : resolve(m.result); }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => { const i = ++id; pending.set(i, { resolve, reject }); ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => { if (pending.has(i)) { pending.delete(i); reject(new Error('timeout ' + method)); } }, 15000); });
  const evalp = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); return r.result ? r.result.value : r; };

  let r;
  try { r = await evalp(READ); } catch (e) { r = { err: String(e).slice(0, 200) }; }

  // 顺带读登录 cookie 到期时间（HttpOnly，document.cookie 摸不到，走 CDP；bm-cookie-expiry.php 消费侧车）
  try {
    const cks = await send('Storage.getCookies');
    const tok = ((cks && cks.cookies) || []).find(c => c.name === 'bigmodel_token_production' && /bigmodel\.cn$/.test(c.domain || ''));
    if (tok && tok.expires > 0) {
      const d = new Date(tok.expires * 1000); const pad = (x) => String(x).padStart(2, '0');
      r.cookieExpiresEpoch = tok.expires;
      r.cookieExpiresAt = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }
  } catch (e) {}

  if (!r || r.err || r.pct === null || r.pct === undefined) {
    try {
      const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 60 });
      fs.writeFileSync('D:/Github/backlink_skills/cdp/bm-check-fail.jpg', Buffer.from(shot.data, 'base64'));
    } catch (e) {}
    ws.close();
    return { port, r };
  }
  ws.close();
  return { port, r };
}

let got = null, lastFail = null;
for (const port of [9227]) {
  const out = await readPort(port);
  if (!out) continue;
  if (!out.r || out.r.err || out.r.pct === null || out.r.pct === undefined) { lastFail = out; continue; }
  got = out; break;
}
if (got) {
  console.log('SOURCE_PORT ' + got.port);
  console.log(JSON.stringify(got.r));
} else {
  console.log('READ_FAIL ' + JSON.stringify(lastFail ? { port: lastFail.port, ...lastFail.r } : { err: 'ALL_PORTS_DOWN' }));
}
