// win2000: wp204 最小发布流 — 系统剪贴板+真Ctrl+V
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
const html = readFileSync('D:/Github/backlink_skills/_win2000_wp204-gen.md', 'utf8');
const tmp = 'D:/Github/backlink_skills/_win2000_clip.txt';
writeFileSync(tmp, html);
execSync(`powershell -command "Set-Clipboard -Value (Get-Content -Raw '${tmp}')"`);

const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.filter(t => t.type === 'page').reverse().find(t => t.url.includes('leoxmseo2'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(1000);
// 1) 标题
await c.eval(`(() => {
  const f = [...document.querySelectorAll('iframe')].find(f => (f.title||'') === 'Editor canvas');
  const d = f.contentDocument;
  const t = d.querySelector('h1.wp-block-post-title');
  t.innerText = '';
  t.focus();
})()`);
await sleep(400);
await c.send('Input.insertText', { text: 'Whole House Generator Cost: Where the Money Actually Goes' });
await sleep(1200);
// 2) 焦点移到正文首块
await c.eval(`(() => {
  const f = [...document.querySelectorAll('iframe')].find(f => (f.title||'') === 'Editor canvas');
  const d = f.contentDocument;
  const title = d.querySelector('h1.wp-block-post-title');
  const els = [...d.querySelectorAll('[contenteditable="true"]')].filter(e => e !== title);
  const target = els.find(e => (e.innerText||'').trim() === '') || els[0];
  target.focus();
})()`);
await sleep(300);
// 3) Ctrl+V
await c.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', modifiers: 2, code: 'KeyV', key: 'v', windowsVirtualKeyCode: 86 });
await c.send('Input.dispatchKeyEvent', { type: 'keyUp', modifiers: 2, code: 'KeyV', key: 'v', windowsVirtualKeyCode: 86 });
await sleep(5000);
const chk = await c.eval(`(() => {
  const f = [...document.querySelectorAll('iframe')].find(f => (f.title||'') === 'Editor canvas');
  const d = f.contentDocument;
  return JSON.stringify({ title: (d.querySelector('h1.wp-block-post-title')?.innerText||'').slice(0,50), textLen: (d.querySelector('.block-editor-block-list__layout')?.innerText||'').length, blocks: d.querySelectorAll('[data-block]').length });
})()`);
console.log('粘贴核验:', chk);
// 4) 面板开+确认(坐标法)
await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 1284, y: 64, button: 'left', clickCount: 1 });
await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 1284, y: 64, button: 'left', clickCount: 1 });
await sleep(4500);
const coords = await c.eval(`(() => {
  return JSON.stringify([...document.querySelectorAll('button')].filter(b => b.getBoundingClientRect().width > 0 && /publish/i.test(b.innerText)).map(b => { const r = b.getBoundingClientRect(); return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), t: b.innerText.trim().slice(0,20), cls: String(b.className).slice(40,110) }; }));
})()`);
console.log('面板候选:', coords);
const list = JSON.parse(coords);
const conf = list.find(b => /editor-post-publish-button/.test(b.cls) && !/panel__toggle/.test(b.cls));
if (conf) {
  console.log('确认钮:', JSON.stringify(conf));
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: conf.x, y: conf.y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: conf.x, y: conf.y, button: 'left', clickCount: 1 });
  await sleep(8000);
}
const fin = await c.eval(`(() => JSON.stringify({ url: location.href.slice(0,90), live: /is now live/.test(document.body.innerText) }))()`);
console.log('终态:', fin);
const s = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 65 });
writeFileSync('D:/Github/backlink_skills/cdp/_win2000_w204fin.jpg', Buffer.from(s.data, 'base64'));
