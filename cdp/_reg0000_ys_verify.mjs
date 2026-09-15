import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const log = (s) => fs.writeSync(1, s + '\n');
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('youslade'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(() => rej(new Error('ws超时')), 8000); });
const c = new CDP(ws);
await c.send('Target.activateTarget', { targetId: tab.id });
await c.send('Page.enable');
await c.send('Page.reload', { ignoreCache: true });
await sleep(8000);
const js = "(() => { const hit = document.body.innerText.includes('bakery fan'); const posts = document.querySelectorAll('[class*=post]').length; return 'HIT=' + hit + ' postEls=' + posts + ' txt=' + document.body.innerText.slice(0, 200); })()";
log(await c.evalT(js, 10000));
// 滚动到feed区找post并抓链接
const link = await c.evalT("(() => { for (const a of document.querySelectorAll('a[href]')) { if (/leoxm26v/.test(a.href) && /status|post/i.test(a.href)) return a.href; } const first = document.querySelector('[class*=post] [class*=time], [class*=post] a'); return first ? first.href : 'NOLINK'; })()", 8000);
log('LINK: ' + link);
ws.close(); process.exit(0);
