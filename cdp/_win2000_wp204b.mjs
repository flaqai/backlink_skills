// 复用已开的 leoxmseo2 wp-admin tab 发布 (2026-09-02 win2000)
import { CDP, sleep } from './CDP.mjs';
import { readFileSync, writeFileSync } from 'fs';
const [htmlPath, title] = ['_win2000_posts/wp204.html', 'Generator Fuel Types Compared: Propane, Natural Gas, Gasoline and Solar'];
const html = readFileSync(htmlPath, 'utf8');
const toBlocks = (h) => {
  const blocks = [];
  const paras = h.split(/\n\n+/).map(s => s.trim()).filter(Boolean);
  for (const p of paras) {
    if (p.startsWith('<h2>')) blocks.push('<!-- wp:heading --><h2>' + p.replace(/^<h2>|<\/h2>$/g, '') + '</h2><!-- /wp:heading -->');
    else if (p.startsWith('<h3>')) blocks.push('<!-- wp:heading {"level":3} --><h3>' + p.replace(/^<h3>|<\/h3>$/g, '') + '</h3><!-- /wp:heading -->');
    else if (p.startsWith('<ul>')) blocks.push('<!-- wp:list -->' + p + '<!-- /wp:list -->');
    else if (p.startsWith('<ol>')) blocks.push('<!-- wp:list {"ordered":true} -->' + p + '<!-- /wp:list -->');
    else blocks.push('<!-- wp:paragraph --><p>' + p.replace(/^<p>|<\/p>$/g, '') + '</p><!-- /wp:paragraph -->');
  }
  return blocks.join('\n\n');
};
const blockHtml = toBlocks(html);

const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes('leoxmseo2.wordpress.com/wp-admin/post-new.php'));
if (!tab) { console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const cdp = new CDP(ws);
await cdp.send('Page.enable'); await cdp.send('Runtime.enable');

// 等标题框出现, 最多60秒
let titleState = 'no-title-input';
for (let i = 0; i < 12; i++) {
  titleState = await cdp.eval(`(() => {
    const inp = document.querySelector('.editor-post-title__input, [aria-label="Add title"], h1[contenteditable=true], textarea[aria-label="Add title"]');
    if (!inp) return 'no-title-input';
    return 'found:' + inp.tagName;
  })()`);
  if (titleState !== 'no-title-input') break;
  console.log('waiting title box...', i);
  await sleep(5000);
}
console.log('标题框:', titleState);
if (titleState === 'no-title-input') {
  const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 60 });
  writeFileSync('_win2000_wp204_stuck.jpg', Buffer.from(shot.data, 'base64'));
  console.log('STUCK, shot saved');
  process.exit(1);
}

// 1) 标题 insertText
await cdp.eval(`(() => { const i = document.querySelector('.editor-post-title__input, [aria-label="Add title"], h1[contenteditable=true], textarea[aria-label="Add title"]'); i.focus(); })()`);
await cdp.send('Input.insertText', { text: title });
await sleep(2000);

// 2) 正文: 点正文区 → insertText 块HTML
const bodyState = await cdp.eval(`(() => {
  const el = document.querySelector('.block-editor-default-block-appender__content, [aria-label="Type text or HTML"], div[contenteditable=true].block-editor-rich-text__editable:not(.editor-post-title__input)');
  if (!el) return 'no-body';
  el.scrollIntoView({ block: 'center' });
  el.click();
  const r = el.getBoundingClientRect();
  return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + 20) });
})()`);
console.log('正文区:', bodyState);
if (bodyState === 'no-body') { console.log('NO BODY'); process.exit(1); }
const bp = JSON.parse(bodyState);
await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: bp.x, y: bp.y, button: 'left', clickCount: 1 });
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: bp.x, y: bp.y, button: 'left', clickCount: 1 });
await sleep(1500);
await cdp.send('Input.insertText', { text: blockHtml });
await sleep(4000);
console.log('正文已灌');

// 3) 保存草稿
await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 's', code: 'KeyS', windowsVirtualKeyCode: 83, modifiers: 2 });
await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 's', code: 'KeyS', windowsVirtualKeyCode: 83, modifiers: 2 });
await sleep(8000);
console.log('保存状态:', await cdp.eval(`(() => { const t = document.body.innerText; return t.includes('Saved') ? 'SAVED' : (t.match(/Saving|Error/)||['?'])[0]; })()`));

// 4) Publish 两段式: 点 Publish 按钮 → 确认面板 Publish
const p1 = await cdp.eval(`(() => {
  const b = [...document.querySelectorAll('button')].find(x => x.innerText.trim() === 'Publish' && !x.disabled && x.offsetWidth > 0);
  if (!b) return 'NO';
  b.scrollIntoView({ block: 'center' });
  const r = b.getBoundingClientRect();
  return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
})()`);
console.log('Publish按钮:', p1);
if (p1 === 'NO') { console.log('NO PUBLISH BTN'); process.exit(1); }
const q1 = JSON.parse(p1);
await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: q1.x, y: q1.y, button: 'left', clickCount: 1 });
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: q1.x, y: q1.y, button: 'left', clickCount: 1 });
await sleep(6000);

// 确认面板可能有 "Are you ready to publish?" — 找第二个 Publish
const p2 = await cdp.eval(`(() => {
  const b = [...document.querySelectorAll('button')].find(x => x.innerText.trim() === 'Publish' && !x.disabled && x.offsetWidth > 0 && !x.closest('.interface-pinned-receipts, .editor-header__settings'));
  if (!b) return 'NO';
  b.scrollIntoView({ block: 'center' });
  const r = b.getBoundingClientRect();
  return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
})()`);
console.log('确认Publish:', p2);
if (p2 !== 'NO') {
  const q2 = JSON.parse(p2);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: q2.x, y: q2.y, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: q2.x, y: q2.y, button: 'left', clickCount: 1 });
  await sleep(10000);
}
console.log('终态URL:', await cdp.eval('location.href'));
console.log('终态文本:', await cdp.eval(`(() => { const t = document.body.innerText; return JSON.stringify({ published: t.includes('is now live') || t.includes('Post published'), viewPost: !!document.querySelector('a[href*="?p="]') }); })()`));
