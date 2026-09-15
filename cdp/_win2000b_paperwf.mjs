// paper.wf 参数化发布（上轮win2000 paperwf3 改造）
// 用法: node _win2000b_paperwf.mjs <html文件> "<标题>" <blog_account_id> <任务站URL>
// 流程: tab(activate) → 登录检查(textarea) → 注入MD → 纸飞机Publish → 终态URL(/leoxm/<slug>) → API补title
// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

import { CDP, sleep } from './CDP.mjs';
import { readFileSync } from 'fs';
const [htmlPath, title, accountId = '179', targetSite = '', domain = 'paper.wf', alias = 'leoxm', pass = 'Pwf26#2026x'] = process.argv.slice(2);
const html = readFileSync(htmlPath, 'utf8');
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

function h2md(h) {
  let s = h;
  s = s.replace(/<h2>([\s\S]*?)<\/h2>/g, '\n\n## $1\n\n');
  s = s.replace(/<h3>([\s\S]*?)<\/h3>/g, '\n\n### $1\n\n');
  s = s.replace(/<p>([\s\S]*?)<\/p>/g, '$1\n\n');
  s = s.replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**');
  s = s.replace(/<em>([\s\S]*?)<\/em>/g, '*$1*');
  s = s.replace(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, '[$2]($1)');
  s = s.replace(/<ul>([\s\S]*?)<\/ul>/g, (m, inner) => '\n' + inner.replace(/<li>([\s\S]*?)<\/li>/g, '- $1\n').replace(/\n\n/g, '\n') + '\n');
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}
const bodyFull = title + '\n\n' + h2md(html);

let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.startsWith('https://' + domain));
if (!tab) tab = await (await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent('https://' + domain + '/'), { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await c.goto('https://' + domain + '/', 30000).catch(e => log('goto warn:', e.message));
await sleep(4000);
const clickXY = async (x, y) => {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};
const login = await c.eval(`(function(){ var ta = document.querySelector('textarea'); return ta ? 'ok:' + ta.offsetLeft + 'x' + ta.offsetTop : 'nf:' + location.href.slice(0,60); })()`);
log('登录检查:', login);
if (login.startsWith('nf')) { console.log(JSON.stringify({ ok: false, error: '未登录' })); process.exit(1); }
console.log('注入:', await c.eval(`(function(){ var ta = document.querySelector('textarea'); ta.focus(); var d = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; d.call(ta, ${JSON.stringify(bodyFull)}); ta.dispatchEvent(new Event('input', {bubbles:true})); return 'len=' + ta.value.length; })()`));
await sleep(1500);
const pb = await c.eval(`(() => { const cand = [...document.querySelectorAll('button, a, [role=button]')].filter(e => e.offsetWidth > 0); const b = cand.find(e => /publish/i.test(e.getAttribute('aria-label') || '')) || cand.find(e => (e.textContent || '').includes('➤')) || cand[cand.length - 1]; if (!b) return 'NO'; const r = b.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), label: b.getAttribute('aria-label') || (b.textContent||'').trim().slice(0,20) }); })()`);
log('Publish钮:', pb);
if (pb === 'NO') { console.log(JSON.stringify({ ok: false, error: 'no publish btn' })); process.exit(1); }
const p = JSON.parse(pb);
await clickXY(p.x, p.y);
await sleep(9000);
const fin = await c.eval(`(() => JSON.stringify({ url: location.href, h1: (document.querySelector('h1')||{}).textContent?.trim()?.slice(0,80) || null, err: (document.querySelector('.alert, .error, [role=alert]')||{}).textContent?.trim()?.slice(0,80) || null }))()`);
log('终态:', fin);
const f = JSON.parse(fin);
const pubUrl = f.url.startsWith('https://' + domain + '/' + alias + '/') ? f.url : '';
// API 补 title
let titlePatch = 'skip';
if (pubUrl) {
  try {
    const lr = await fetch('https://' + domain + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ alias, pass }) });
    const lj = await lr.json();
    const tk = lj?.data?.access_token;
    if (tk) {
      const pr = await fetch('https://' + domain + '/api/me/posts?limit=5', { headers: { 'accept': 'application/json', 'authorization': 'Bearer ' + tk } });
      const pj = await pr.json();
      const posts = pj?.data?.posts || pj?.data || [];
      const mine = (Array.isArray(posts) ? posts : []).find(x => (x.body || '').includes(title.slice(0, 20)) || x.title === title) || (Array.isArray(posts) ? posts[0] : null);
      if (mine?.id) {
        const up = await fetch('https://' + domain + '/api/posts/' + mine.id, { method: 'POST', headers: { 'content-type': 'application/json', 'accept': 'application/json', 'authorization': 'Bearer ' + tk }, body: JSON.stringify({ title }) });
        titlePatch = 'post ' + mine.id + ' http ' + up.status;
      } else titlePatch = 'no matching post';
    } else titlePatch = 'login fail';
  } catch (e) { titlePatch = 'err ' + e.message; }
}
log('title补丁:', titlePatch);
const anchor = pubUrl ? await (async () => {
  const r = await fetch(pubUrl); const t = await r.text();
  return t.includes(targetSite.replace(/https?:\/\//, '')) ? 'anchor-in-dom' : 'anchor-missing(title-only-check)';
})() : 'n/a';
console.log(JSON.stringify({ ok: !!pubUrl, url: pubUrl, titlePatch, anchor, err: f.err }));
process.exit(0);
