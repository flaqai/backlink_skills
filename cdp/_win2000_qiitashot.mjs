import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes('qiita.com/drafts/'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
// 找标签错误提示与标签输入框
console.log(await c.eval(`(() => JSON.stringify({
  tagInput: !!document.querySelector('input[placeholder*=タグ i], .tagInput input, input[name*=tag i]'),
  tags: [...document.querySelectorAll('.tagChip, [class*=tagChip], [data-testid*=tag]')].map(e => e.textContent.trim()).slice(0,5),
  alertTxt: [...document.querySelectorAll('div,p,li')].filter(e => e.offsetWidth > 0 && e.children.length === 0 && /タグ|エラー|error|必須|required/i.test(e.textContent)).map(e => e.textContent.trim().slice(0,60)).slice(0,5)
}))()`));
const shot = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 55 });
writeFileSync('_win2000_qiita.jpg', Buffer.from(shot.data, 'base64'));
console.log('shot saved');
