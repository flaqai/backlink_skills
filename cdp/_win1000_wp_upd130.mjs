// win1000: 已登录, 从wordpress.com主域调public-api更新post#38
// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

import { readFileSync } from 'fs';
const content = readFileSync('D:/Github/seoadminC/storage/_win130_newcontent.html', 'utf8');
const t = await (await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent('https://wordpress.com/read'), { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const { CDP } = await import('./CDP.mjs');
const c = new CDP(ws);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
await sleep(9000);
log('URL:', await c.eval('location.href.slice(0,60)'));
const me = await c.eval(`fetch('https://public-api.wordpress.com/rest/v1.1/me', {credentials:'include'}).then(r=>r.text()).catch(e=>'ERR:'+e.message)`);
log('me:', String(me).slice(0, 100));
if (/authorization_required|ERR:/.test(me)) { log('!!未登录或fetch失败'); process.exit(2); }
const form = new URLSearchParams({ content }).toString();
const r = await c.eval(`fetch('https://public-api.wordpress.com/rest/v1.1/sites/leoxmseo2.wordpress.com/posts/38', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: ${JSON.stringify(form)} }).then(r=>r.text()).catch(e=>'ERR:'+e.message)`);
try { const j = JSON.parse(r); log('resp ID:', j.ID, '| status:', j.status, '| error:', j.error || 'none'); } catch (e) { log('raw:', String(r).slice(0, 200)); }
await sleep(3000);
const live = await (await fetch('https://leoxmseo2.wordpress.com/2026/09/05/your-vehicles-smog-check-history-why-it-matters-and-how-to-read-it/?nocache=' + Date.now(), { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0' } })).text();
log('线上锚链href:', (live.match(/href="https:\/\/smogcheck-nearme\.com"/g) || []).length, '处');
try { await fetch('http://127.0.0.1:9224/json/close/' + t.id); } catch {}
process.exit(0);
