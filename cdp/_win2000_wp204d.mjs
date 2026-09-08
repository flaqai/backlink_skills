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
// 1) 点 Options(⋮) 菜单
const op = await cdp.eval(`(() => { const b = document.querySelector('.interface-more-menu-dropdown__toggle, button[aria-label="Options"]'); if (!b) return 'NO'; const r = b.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }); })()`);
console.log('Options:', op);
if (op === 'NO') process.exit(1);
const o = JSON.parse(op);
await click(o.x, o.y);
await sleep(2500);
// 2) 点 Code editor 菜单项
const ce = await cdp.eval(`(() => { const b = [...document.querySelectorAll('button[role=menuitem], button')].find(x => /code editor/i.test(x.innerText) && x.offsetWidth > 0); if (!b) return 'NO'; const r = b.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }); })()`);
console.log('CodeEditor项:', ce);
if (ce === 'NO') { const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 60 }); writeFileSync('_win2000_wp204_menu.jpg', Buffer.from(shot.data, 'base64')); process.exit(1); }
const c2 = JSON.parse(ce);
await click(c2.x, c2.y);
await sleep(4000);
console.log('切换后:', await cdp.eval(`(() => JSON.stringify({ cm: !!document.querySelector('.cm-content, textarea.editor-post-text-editor'), title: !!document.querySelector('.editor-post-title__input') }))()`));
