// win1000 验收②: 给 leoxmseo2.wordpress.com post#38 补 smogcheck-nearme.com 锚链 (cookie会话直调public-api)
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
const c = new (await import('./CDP.mjs')).CDP(ws);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
await sleep(10000);
const here = await c.eval('location.href.slice(0,80)');
log('tab URL:', here);
if (/log-in/.test(here)) { log('!! 登录态已失效, 需走magic-link'); process.exit(2); }
const who = await c.eval(`fetch('https://public-api.wordpress.com/rest/v1.1/me', {credentials:'include'}).then(r=>r.text()).catch(e=>'ERR:'+e.message)`);
log('me:', String(who).slice(0, 160));
const form = new URLSearchParams({ content }).toString();
const r = await c.eval(`fetch('https://public-api.wordpress.com/rest/v1.1/sites/leoxmseo2.wordpress.com/posts/38', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: ${JSON.stringify(form)} }).then(r=>r.text()).catch(e=>'ERR:'+e.message)`);
let ok = false;
try { const j = JSON.parse(r); ok = !j.error; log('resp ID:', j.ID, '| status:', j.status, '| error:', j.error || 'none'); } catch (e) { log('resp raw:', String(r).slice(0, 200)); }
await sleep(3000);
const live = await (await fetch('https://leoxmseo2.wordpress.com/2026/09/05/your-vehicles-smog-check-history-why-it-matters-and-how-to-read-it/', { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0' } })).text();
log('线上锚链:', (live.match(/href="https:\/\/smogcheck-nearme\.com"/g) || []).length, '处 href');
try { await fetch('http://127.0.0.1:9224/json/close/' + t.id); } catch {}
process.exit(0);
