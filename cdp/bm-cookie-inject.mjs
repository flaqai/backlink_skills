// bm-cookie-inject.mjs — 一次性登录引导工具（2026-09-21 额度管家改造后不在管线里跑）
// 用途：部署/换号时把一份 bigmodel cookie 种进 9227 专属保活 Chrome 的 profile，
//       之后的登录态由该实例 profile 自持（管线不再有任何导入步骤——2026-09-21 用户定稿）。
// 用法：node bm-cookie-inject.mjs [port]        ← 缺省 9227
// 输入：cdp/bm-cookie-manual.json（扩展回存格式，或手工按 {cookie:{name,value,domain,...}} 构造）
// 成功：刷新 bm-cookie-expiry.json 侧车 + manual 改名 .done；无效：改名 .invalid。
import fs from 'fs';

const PORT = String(process.argv[2] || '9227');
const DIR = 'D:/Github/backlink_skills/cdp';
const MANUAL = DIR + '/bm-cookie-manual.json';
const BASE = `http://127.0.0.1:${PORT}`;
const URL = 'https://www.bigmodel.cn/coding-plan/personal/usage';

const now = () => { const d = new Date(); const p = (x) => String(x).padStart(2, '0'); return `[${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}]`; };
const wlog = (line) => { try { fs.appendFileSync(DIR + '/bm-watch.log', `${now()} ${line}\n`); } catch {} console.log(line); };

const fromManual = fs.existsSync(MANUAL);
let payload;
if (fromManual) {
  try { payload = JSON.parse(fs.readFileSync(MANUAL, 'utf8')); } catch (e) {
    fs.renameSync(MANUAL, MANUAL + '.invalid');
    wlog('INJECT: manual JSON 解析失败 → .invalid');
    process.exit(2);
  }
} else {
  // 无待注入文件：直接退出（一次性工具不回种存档——管线已无注入步骤，2026-09-21）
  process.exit(0);
}
const c = payload.cookie || {};
if (!/bigmodel\.cn/.test(c.domain || '') || typeof c.value !== 'string' || c.value.length < 50) {
  if (fromManual) {
    fs.renameSync(MANUAL, MANUAL + '.invalid');
    wlog(`INJECT: 无效cookie(domain=${c.domain || '?'} len=${(c.value || '').length}) → .invalid`);
  }
  process.exit(2);
}

// Chrome 9224 必须在线；不在线保留文件，bat 下轮自动重试
let list;
try { list = await (await fetch(BASE + '/json/list')).json(); } catch (e) { wlog('INJECT: CHROME_DOWN，文件保留待下轮'); process.exit(0); }
let page = list.find(t => t.type === 'page' && /bigmodel\.cn/.test(t.url));
if (!page) {
  await fetch(BASE + '/json/new?' + encodeURIComponent(URL), { method: 'PUT' });
  await new Promise(r => setTimeout(r, 5000));
  list = await (await fetch(BASE + '/json/list')).json();
  page = list.find(t => t.type === 'page' && /bigmodel\.cn/.test(t.url));
}
if (!page) { wlog('INJECT: NO_TAB，文件保留待下轮'); process.exit(0); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); setTimeout(rej, 8000); });
let id = 0; const pending = new Map();
ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((resolve, reject) => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => { if (pending.has(i)) { pending.delete(i); reject(new Error('timeout ' + method)); } }, 10000); });

const sameSite = ['no_restriction', 'lax', 'strict', 'unspecified'].includes(c.sameSite) ? c.sameSite : 'unspecified';
await send('Storage.setCookies', { cookies: [{
  name: c.name, value: c.value,
  domain: c.domain, path: c.path || '/',
  secure: c.secure !== false, httpOnly: !!c.httpOnly,
  sameSite, expires: c.expires || (Math.floor(Date.now() / 1000) + 604800),
}] });

// 回读校验 + 刷新到期侧车（每日检查脚本直接受益，无需再拷被锁的 Cookies 库）
const cks = await send('Storage.getCookies');
const tok = ((cks && cks.cookies) || []).find(x => x.name === c.name && /bigmodel\.cn$/.test(x.domain || ''));
ws.close();
if (!tok || tok.value !== c.value) { wlog('INJECT: 注入后回读不一致，文件保留待下轮重试'); process.exit(3); }

const d = new Date(tok.expires * 1000); const p2 = (x) => String(x).padStart(2, '0');
const expiresAt = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds());
fs.writeFileSync(DIR + '/bm-cookie-expiry.json', JSON.stringify({ expires_at: expiresAt, expires_epoch: tok.expires, checked_at: now().replace(/[\[\]]/g, ''), source: 'inject' }));
const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
fs.renameSync(MANUAL, `${MANUAL}.done-${ts}`);
// 挂验证旗标：注入成功 → gate 无条件放行一次采样，当场验证可用并接回刷新点链
fs.writeFileSync(DIR + '/BM_VERIFY_COOKIE', String(Math.floor(Date.now() / 1000)));
wlog(`INJECT: ${c.name} 已注入${PORT}专属实例，到期 ${expiresAt}（保存于 ${payload.received_at || '?'}）→ 已挂验证采样旗标`);
process.exit(0);
