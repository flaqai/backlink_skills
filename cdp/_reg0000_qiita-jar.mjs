// reg0000: qiita jar 注入 + 登录态检查
import { CDP, sleep } from './CDP.mjs';
import { readFileSync } from 'fs';
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const jar = JSON.parse(readFileSync('D:/Github/backlink_skills/cookies/default/qiita.com.json', 'utf8'));
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let page = list.find(t => t.type === 'page' && /qiita\.com/.test(t.url));
if (!page) {
  const t = await (await fetch('http://127.0.0.1:9224/json/new?https://qiita.com/', { method: 'PUT' })).json();
  await sleep(8000);
  page = t;
} else {
  await fetch('http://127.0.0.1:9224/json/activate/' + page.id).catch(() => {});
}
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Network.enable');
let n = 0;
for (const ck of jar.cookies) {
  const params = { name: ck.name, value: ck.value, domain: ck.domain, path: ck.path || '/', secure: !!ck.secure, httpOnly: !!ck.httpOnly };
  if (ck.expires && ck.expires > 0) params.expires = ck.expires;
  try { await c.send('Network.setCookie', params); n++; } catch (e) {}
}
log('cookies injected:', n);
await c.send('Page.navigate', { url: 'https://qiita.com/drafts/new' });
await sleep(12000);
console.log('URL:', await c.eval('location.href'));
console.log('TITLE_INP:', await c.eval(`(() => { const i=document.querySelector('input[placeholder*="タイトル"], input[placeholder*="Title"]'); return i ? 'OK' : 'NO'; })()`));
console.log('LOGIN_CHK:', await c.eval(`(() => { const a=document.querySelector('a[href*="/settings"], img[alt*="@"], [data-testid*="avatar"]'); return a ? 'LOGGED_IN:'+(a.href||a.alt||'') : 'CHECK:'+(document.body.innerText||'').slice(0,80).replace(/\\n/g,'|'); })()`));
