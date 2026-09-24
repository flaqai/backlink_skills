// reg0000 0909: creatorlink 第三步——等发布处理完成→读状态→输出公开URL供验证
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const log = (s) => fs.writeSync(1, s + '\n');

let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('creatorlink'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(() => rej(new Error('ws超时')), 8000); });
const c = new CDP(ws);
await c.send('Page.enable');

// 轮询最多60s：等「게시중」弹层消失
let done = false;
for (let i = 0; i < 12; i++) {
  await sleep(5000);
  const st = await c.evalT(`(() => {
    const pt = document.querySelector('.publish-text');
    const sw = document.querySelector('#site-publish-onoff');
    const vis = (e) => { if (!e) return false; const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0; };
    const loading = [...document.querySelectorAll('div,p,h2,h3,span')].some(e => vis(e) && /게시중|처리중/.test(e.innerText || '') && (e.innerText || '').length < 60);
    return JSON.stringify({ checked: sw ? sw.checked : null, ptext: pt ? pt.innerText : null, loading });
  })()`, 8000);
  log('POLL' + i + ': ' + st);
  const o = JSON.parse(st);
  if (!o.loading && o.ptext && !/미게시/.test(o.ptext)) { done = true; break; }
  if (!o.loading && i > 3) break;
}
log('DONE=' + done);

const shot = await c.send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('D:/Github/seoadminC/storage/_reg0000_cl_published.png', Buffer.from(shot.data, 'base64'));
log('SHOT saved');
log('FINAL_URL: https://leoxmnotes.creatorlink.net');
log('DONE');
