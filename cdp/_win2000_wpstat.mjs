import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const slug = process.argv[2] || '';
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.filter(t => t.type === 'page').reverse().find(t => t.url.includes('post.php') || (slug && t.url.includes(slug)));
if (!tab) { console.log('NO POST TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(1500);
console.log('URL:', await c.eval('location.href.slice(0,100)'));
const js = `(() => {
  const txt = document.body.innerText;
  const status = (txt.match(/(Published|Draft|Scheduled|发布|草稿)/g) || []).slice(0, 5);
  const pl = [...document.querySelectorAll('a')].map(a => a.href).filter(h => /\\d{4}\\/\\d{2}\\//.test(h)).slice(0, 3);
  const viewBtn = [...document.querySelectorAll('a')].find(a => /^(view|查看)/i.test(a.innerText.trim()))?.href;
  return JSON.stringify({ status, permalinks: pl, viewBtn });
})()`;
console.log(await c.eval(js));
const shot = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 60 });
writeFileSync('D:/Github/backlink_skills/cdp/_win2000_wpstat.jpg', Buffer.from(shot.data, 'base64'));
console.log('shot saved');
