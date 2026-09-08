// leoxmseo2 发布: 切代码编辑器→标题+cm-content→存草稿→Publish (win2000)
import { CDP, sleep } from './CDP.mjs';
import { readFileSync, writeFileSync } from 'fs';
const html = readFileSync('_win2000_posts/wp204.html', 'utf8');
const title = 'Generator Fuel Types Compared: Propane, Natural Gas, Gasoline and Solar';
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
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws超时')), 8000); });
const cdp = new CDP(ws);
await cdp.send('Page.enable'); await cdp.send('Runtime.enable');
const click = async (x, y) => {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};

// 1) 若还在可视化模式(iframe canvas), 先切代码编辑器
const mode = await cdp.eval(`(() => ({ cm: !!document.querySelector('.cm-content, textarea.editor-post-text-editor'), title: !!document.querySelector('.editor-post-title__input'), ifr: [...document.querySelectorAll('iframe')].some(f => f.title === 'Editor canvas') }))()`);
console.log('模式:', mode);
if (mode.ifr && !mode.cm) {
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'm', code: 'KeyM', windowsVirtualKeyCode: 77, modifiers: 7 });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'm', code: 'KeyM', windowsVirtualKeyCode: 77, modifiers: 7 });
  await sleep(4000);
  console.log('切换后:', await cdp.eval(`(() => ({ cm: !!document.querySelector('.cm-content, textarea.editor-post-text-editor'), title: !!document.querySelector('.editor-post-title__input') }))()`));
}

// 2) 标题
const tEl = await cdp.eval(`(() => { const i = document.querySelector('.editor-post-title__input, textarea[aria-label="Add title"]'); if (!i) return 'NO'; i.focus(); const r = i.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + 200), y: Math.round(r.y + 20) }); })()`);
console.log('标题框:', tEl);
if (tEl === 'NO') { console.log('FAIL no title'); process.exit(1); }
await click(JSON.parse(tEl).x, JSON.parse(tEl).y);
await sleep(1000);
await cdp.send('Input.insertText', { text: title });
await sleep(1500);

// 3) 正文 cm-content
const cEl = await cdp.eval(`(() => { const el = document.querySelector('.cm-content') || document.querySelector('textarea.editor-post-text-editor'); if (!el) return 'NO'; el.scrollIntoView({ block: 'center' }); if (el.focus) el.focus(); const r = el.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + 30) }); })()`);
console.log('代码区:', cEl);
if (cEl === 'NO') { console.log('FAIL no cm'); process.exit(1); }
const cc = JSON.parse(cEl);
await click(cc.x, cc.y);
await sleep(1000);
await cdp.send('Input.insertText', { text: blockHtml });
await sleep(5000);
console.log('块HTML已灌, cm长度:', await cdp.eval(`(() => { const el = document.querySelector('.cm-content'); return el ? el.textContent.length : (document.querySelector('textarea.editor-post-text-editor')||{}).value?.length || 0; })()`));

// 4) Ctrl+S 存草稿
await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 's', code: 'KeyS', windowsVirtualKeyCode: 83, modifiers: 2 });
await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 's', code: 'KeyS', windowsVirtualKeyCode: 83, modifiers: 2 });
await sleep(8000);

// 5) Publish 两段
for (let round = 0; round < 2; round++) {
  const p = await cdp.eval(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.innerText.trim() === 'Publish' && !x.disabled && x.offsetWidth > 0); if (!b) return 'NO'; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }); })()`);
  console.log('Publish#' + round, p);
  if (p === 'NO') break;
  const q = JSON.parse(p);
  await click(q.x, q.y);
  await sleep(6000);
}
await sleep(4000);
console.log('终态:', await cdp.eval(`(() => JSON.stringify({ url: location.href, live: document.body.innerText.includes('is now live'), editorUrl: document.body.innerText.match(/leoxmseo2[\s\S]{0,0}/) ? 1 : 1, postLink: (document.querySelector('.post-publish-panel__postcontent-buttons a, a.components-button[href*="p="]')||{}).href || null }))()`));
