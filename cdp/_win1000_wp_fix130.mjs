// win1000 验收②: 给 leoxmseo2.wordpress.com post#38 补 smogcheck-nearme.com 锚链 (cookie会话直调public-api)
// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

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
