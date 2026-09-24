// _win2000_wperm.mjs: 从已存在的 post.php 编辑 tab 读 permalink <postid匹配串>
import { sleep } from './CDP.mjs';
const match = process.argv[2] || 'post.php?post=28';
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.filter(t => t.type === 'page').reverse().find(t => t.url.includes(match) && !t.url.includes('post-new'));
if (!tab) { console.log('NO TAB for ' + match); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); setTimeout(() => rej(new Error('ws超时')), 8000); });
let id = 0; const pending = new Map();
ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result || {}); pending.delete(m.id); } });
const send = (method, params = {}) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params })); return new Promise((res) => pending.set(i, res)); };
const evalExpr = async (expr, ms = 10000) => {
  const r = await Promise.race([ send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }),
    new Promise((res) => setTimeout(() => res({ timeout: 1 }), ms)) ]);
  if (r.timeout) return 'TIMEOUT';
  return r.result?.value === undefined ? '' : r.result.value;
};
// wp-admin 编辑页 action link: <a href="...?p=28&preview">View post</a> 或 #wpadminbar 里的 View Post
const perm = await evalExpr(`(() => {
  const links = [...document.querySelectorAll('a')].map(a => a.href);
  const view = links.find(h => /post-\d+\.php|\?p=\d+/.test(h) && !h.includes('action=edit'));
  return view || links.filter(h => h.includes('leoxmseo2.wordpress.com') && !h.includes('wp-admin')).slice(0,3).join(' | ');
})()`);
console.log('PERMALINK:', perm);
process.exit(0);
