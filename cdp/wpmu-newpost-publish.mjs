/**
 * wpmu-newpost-publish.mjs — WPMU壳族(tokka/blog-eye系)发文工具（reg0000 0911 固化）
 * 适用: tokka-blog.com / blog-eye.com 及同引擎兄弟壳（/Dashboard+/new-post映射路径族）
 * 前提: 浏览器已登录该壳（cookie 在 9224 或先用 login.mjs use <domain>）
 * 用法: node wpmu-newpost-publish.mjs <domain> <title> <bodyHtmlFile> [tabId]
 *   - 无 tabId: 自开 https://<domain>/new-post tab（复用现有会话）
 * 流程: GET /new-post → 取 _wpnonce + post_ID(auto-draft) → 同页 fetch POST editpost
 *       (post_status=publish + publish=Publish) → 返回首页核验标题出现
 * 坑位: ①CF 只硬拦 /wp-admin/*，映射路径(/Dashboard /new-post /posts-list)全通
 *       ②POST 200 回渲染空编辑器是正常现象，真值必须看子域/站首页匿名可读
 *       ③_wpnonce 全族同值 b1cfecdc1d 但仍以现场取值为准
 *       ④curl 直发需 PHPSESSID+session_id 双 cookie（tokka实锤），浏览器 fetch 则自动带
 */
const domain = process.argv[2];
const title = process.argv[3];
const bodyFile = process.argv[4];
const fs = await import('fs');
const bodyHtml = fs.readFileSync(bodyFile, 'utf-8');

const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && t.url.includes(domain));
if (!tab) {
  tab = await (await fetch(`http://127.0.0.1:9224/json/new?https://${domain}/new-post`)).json();
  await new Promise(r => setTimeout(r, 7000));
}
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; setTimeout(() => j(new Error('ws timeout')), 8000); });
let mid = 0; const pend = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (method, params = {}) => new Promise(res => { const id = ++mid; pend.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
const ev = async (expr, tmo = 15000) => {
  const r = await Promise.race([send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }), new Promise(res => setTimeout(() => res({ timeout: true }), tmo))]);
  if (r.timeout) return 'EVAL-TIMEOUT';
  return r.result?.result?.value;
};
await send('Page.enable');
await send('Target.activateTarget', { targetId: tab.id });
await send('Page.navigate', { url: `https://${domain}/new-post` });
await new Promise(r => setTimeout(r, 7000));
const meta = JSON.parse(await ev(`JSON.stringify({nonce: document.querySelector('#_wpnonce')?.value || document.querySelector('input[name=_wpnonce]')?.value, postId: document.querySelector('#post_ID')?.value || document.querySelector('input[name=post_ID]')?.value})`));
if (!meta.nonce || !meta.postId) { console.log('FAIL: no nonce/postId', JSON.stringify(meta)); process.exit(1); }
const enc = encodeURIComponent;
const payload = `_wpnonce=${meta.nonce}&_wp_http_referer=${enc('/wp-admin/post-new.php')}&user_ID=1&action=editpost&originalaction=editpost&post_author=1&post_type=post&original_post_status=auto-draft&referredby=${enc('#')}&post_ID=${meta.postId}&auto_draft=1&post_title=${enc(title)}&content=${enc(bodyHtml)}&post_status=publish&visibility=public&publish=Publish&mm=09&jj=11&aa=2026&hh=01&mn=00&ss=00&post_category%5B%5D=1&comment_status=open&ping_status=closed`;
const result = await ev(`fetch('https://${domain}/new-post', {method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body: '${payload}', redirect:'manual'}).then(r => r.status + '|' + (r.headers.get('location')||'-')).catch(e=>'ERR '+e.message)`, 25000);
console.log('post-result:', result);
const check = await ev(`fetch('/', {redirect:'follow'}).then(r=>r.text()).then(t=>t.includes(${JSON.stringify(title)})).catch(e=>'ERR')`, 15000);
console.log('live-verify(标题出现在站内):', check);
ws.close();
process.exit(result && result.startsWith('200') ? 0 : 1);
