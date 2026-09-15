// win1000: 走leoxmseo2 wp-admin REST(nonce)更新post 38
// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

import { readFileSync } from 'fs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent('https://leoxmseo2.wordpress.com/wp-admin/post.php?post=38&action=edit'), { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const { CDP } = await import('./CDP.mjs');
const c = new CDP(ws);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
await sleep(14000);
const here = await c.eval('location.href.slice(0,95)');
log('落地:', here);
if (/log-in/.test(here)) { log('!!leoxmseo2 admin 无权/需登录'); process.exit(2); }
const nonce = await c.eval(`JSON.stringify({ a: window.wpApiSettings?.nonce || '', b: document.querySelector('#_wpnonce')?.value || '', c: window.wp?.api?.fetch ? 'wpapi-ok' : 'no-wpapi', title: document.querySelector('h1.editor-post-title__input, .editor-post-title__input')?.textContent?.slice(0,60) || document.title.slice(0,60) })`);
log('nonce探测:', nonce);
const n = JSON.parse(nonce);
if (!n.a && !n.b) { log('!!无nonce'); process.exit(3); }
const content = readFileSync('D:/Github/seoadminC/storage/_win130_newcontent.html', 'utf8');
const body = JSON.stringify({ content });
const r = await c.eval(`fetch('/wp-json/wp/v2/posts/38', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': ${JSON.stringify(n.a || n.b)} }, body: ${JSON.stringify(body)} }).then(r=>r.text()).catch(e=>'ERR:'+e.message)`);
try { const j = JSON.parse(r); log('resp id:', j.id, '| status:', j.status, '| msg:', j.message || 'none'); } catch (e) { log('raw:', String(r).slice(0, 220)); }
await sleep(2500);
const live = await (await fetch('https://leoxmseo2.wordpress.com/2026/09/05/your-vehicles-smog-check-history-why-it-matters-and-how-to-read-it/?nocache=' + Date.now(), { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0' } })).text();
log('线上锚链href:', (live.match(/href="https:\/\/smogcheck-nearme\.com"/g) || []).length, '处');
try { await fetch('http://127.0.0.1:9224/json/close/' + t.id); } catch {}
process.exit(0);
