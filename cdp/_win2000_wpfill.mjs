// win2000: wordpress.com iframe-canvas 块编辑器发布器
// 用法: node _win2000_wpfill.mjs <html文件> "<标题>" [tab匹配slug]
import { CDP, sleep } from './CDP.mjs';
import { readFileSync, writeFileSync } from 'fs';

const [htmlPath, title, slug] = process.argv.slice(2);
const html = readFileSync(htmlPath, 'utf8');
const pasteText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const pages = tabs.filter(t => t.type === 'page');
const tab = pages.reverse().find(t => t.url.includes('post-new.php') && (!slug || t.url.includes(slug)));
if (!tab) { console.log('NO EDITOR TAB for', slug || '(any)'); process.exit(1); }
console.log('tab:', tab.url.slice(0, 80));

const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');

// 1) 等编辑器就绪
let ready = '';
for (let i = 0; i < 15; i++) {
  ready = await c.eval(`(() => {
    const f = [...document.querySelectorAll('iframe')].find(f => (f.title||'') === 'Editor canvas' && f.contentDocument);
    if (!f) return 'no-canvas';
    const t = f.contentDocument.querySelector('h1.wp-block-post-title, .editor-post-title__input');
    return t ? 'ready' : 'no-title-in-canvas';
  })()`);
  if (ready === 'ready') break;
  await sleep(2000);
}
console.log('canvas:', ready);
if (ready !== 'ready') { console.log('停: canvas未就绪'); process.exit(1); }

// 2) 标题
await c.eval(`(() => {
  const f = [...document.querySelectorAll('iframe')].find(f => (f.title||'') === 'Editor canvas');
  f.contentDocument.querySelector('h1.wp-block-post-title, .editor-post-title__input').focus();
})()`);
await sleep(500);
await c.send('Input.insertText', { text: title });
await sleep(1500);
const titleCheck = await c.eval(`(() => {
  const f = [...document.querySelectorAll('iframe')].find(f => (f.title||'') === 'Editor canvas');
  return (f.contentDocument.querySelector('h1.wp-block-post-title')?.innerText || '').slice(0, 70);
})()`);
console.log('标题核验:', titleCheck);

// 3) 正文: DataTransfer 合成 paste (Gutenberg paste handler 自动转块)
const pasteJs = `(() => {
  const f = [...document.querySelectorAll('iframe')].find(f => (f.title||'') === 'Editor canvas');
  const d = f.contentDocument;
  const title = d.querySelector('h1.wp-block-post-title');
  const els = [...d.querySelectorAll('[contenteditable="true"]')].filter(e => e !== title);
  const target = els.find(e => (e.innerText||'').trim() === '') || els[0];
  if (!target) return 'no-block';
  target.focus();
  const dt = new DataTransfer();
  dt.setData('text/html', ${JSON.stringify(html)});
  dt.setData('text/plain', ${JSON.stringify(pasteText)});
  const ev = new ClipboardEvent('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'clipboardData', { value: dt });
  target.dispatchEvent(ev);
  return 'pasted';
})()`;
const pr = await c.eval(pasteJs);
console.log('paste:', pr);
await sleep(3500);
const lenCheck = await c.eval(`(() => {
  const f = [...document.querySelectorAll('iframe')].find(f => (f.title||'') === 'Editor canvas');
  const d = f.contentDocument;
  return JSON.stringify({ blocks: d.querySelectorAll('[data-block]').length, textLen: (d.querySelector('.block-editor-block-list__layout')?.innerText || '').length, anchors: [...d.querySelectorAll('a')].length });
})()`);
console.log('内容核验:', lenCheck);
const parsed = JSON.parse(lenCheck);
if (parsed.textLen < 500) { console.log('停: 正文注入不足, 需人工检查'); process.exit(1); }

// 4) 存草稿
await c.eval(`(() => { const b = [...document.querySelectorAll('button')].find(b => /save draft/i.test(b.innerText.trim())); if (b) { b.scrollIntoView({block:'center'}); b.click(); } })()`);
await sleep(4000);
// 5) Publish 两段式
const p1 = await c.eval(`(() => { const b = [...document.querySelectorAll('button')].find(b => /^(publish|发布)$/i.test(b.innerText.trim())); if (b) { b.scrollIntoView({block:'center'}); b.click(); return 'clicked'; } return 'nf'; })()`);
console.log('Publish主钮:', p1);
await sleep(4000);
const p2 = await c.eval(`(() => {
  const vis = [...document.querySelectorAll('button')].filter(b => b.getBoundingClientRect().width > 0);
  const b = vis.find(b => /publish again|go live|立即发布|live now/i.test(b.innerText)) || vis.find(b => /^(publish|发布)$/i.test(b.innerText.trim()));
  if (b) { b.scrollIntoView({block:'center'}); b.click(); return 'clicked:' + b.innerText.trim().slice(0,30); }
  return 'nf:' + vis.map(x => x.innerText.trim()).filter(t => t && t.length < 28).slice(0, 12).join('|');
})()`);
console.log('Publish确认:', p2);
await sleep(9000);
console.log('URL:', await c.eval('location.href.slice(0,110)'));
const shot = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 60 });
writeFileSync('D:/Github/backlink_skills/cdp/_win2000_wp_' + (slug || 'x') + '.jpg', Buffer.from(shot.data, 'base64'));
console.log('shot saved');
