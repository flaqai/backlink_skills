// win2000: 视觉坐标流发布 — 截图→鼠标真实点击→再截图
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync, readFileSync } from 'fs';
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.filter(t => t.type === 'page').reverse().find(t => t.url.includes('post.php?post=54'));
if (!tab) { console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(1000);
const click = async (x, y) => {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};
const shot = async (name) => {
  const s = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
  writeFileSync('D:/Github/backlink_skills/cdp/' + name, Buffer.from(s.data, 'base64'));
};
// 1) 点右上 Publish 主钮
await click(1284, 64);
await sleep(4000);
await shot('_win2000_pub_step1.jpg');
// 2) 面板内确认钮位置: 用 JS 只读坐标(不点击) - 找所有含 publish 文本可见钮的坐标
const coords = await c.eval(`(() => {
  return JSON.stringify([...document.querySelectorAll('button')].filter(b => b.getBoundingClientRect().width > 0 && /publish/i.test(b.innerText)).map(b => { const r = b.getBoundingClientRect(); return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), t: b.innerText.trim().slice(0,20), cls: String(b.className).slice(0,60) }; }));
})()`);
console.log('候选坐标:', coords);
