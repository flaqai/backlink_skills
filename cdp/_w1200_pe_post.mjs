// _w1200_pe_post.mjs — win1200: posteezy 发文(ai-video-generator-free, 锚链→aivideogeneratorfree.org)
import { CDP } from './CDP.mjs';
import { readFileSync } from 'fs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TITLE = 'AI Video Generator Free: What Free Tiers Actually Give You in 2026';
let body = readFileSync('D:/Github/backlink_skills/blog-articles/ai-video-generator-free/article.html', 'utf8').trim();
// 去掉可能的task card块(以<!--开头注释段或Task card字样)
body = body.replace(/<!--[\s\S]*?-->/g, '');
if (/task card/i.test(body)) { console.log('WARN: task card字样残留!'); }

const tab = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await new Promise(r => setTimeout(r, 300));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
const shot = async (name) => {
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
  const fs = await import('fs');
  fs.writeFileSync(`D:/Github/backlink_skills/cdp/_w1200_${name}.jpg`, Buffer.from(data, 'base64'));
  console.log('shot:', name);
};

try {
  await cdp.send('Page.navigate', { url: 'https://posteezy.com/node/add/article' });
  await sleep(10000);
  const ok = await cdp.eval(`!!document.querySelector('input[name="title[0][value]"]')`);
  if (!ok) throw new Error('表单不在(可能掉登录)');
  // 标题
  await cdp.eval(`(() => { const e = document.querySelector('input[name="title[0][value]"]'); const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(e, ${JSON.stringify(TITLE)}); e.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await sleep(500);
  // 正文(隐藏textarea: native setter+input+change)
  await cdp.eval(`(() => { const e = document.querySelector('textarea[name="body[0][value]"]'); const set = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set; set.call(e, ${JSON.stringify(body)}); e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await sleep(500);
  // tags
  await cdp.eval(`(() => { const e = document.querySelector('input[name="field_tags[target_id]"]'); if (!e) return; const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(e, 'ai video, free tools, video generator'); e.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await sleep(500);
  console.log('title-len:', await cdp.eval(`document.querySelector('input[name="title[0][value]"]').value.length`));
  console.log('body-len:', await cdp.eval(`document.querySelector('textarea[name="body[0][value]"]').value.length`));
  // Post 提交
  const b = await cdp.eval(`(() => {
    const btn = [...document.querySelectorAll('button, input[type=submit]')].find(x => /^post$/i.test((x.innerText || x.value || '').trim()) && x.offsetParent !== null);
    if (!btn) return 'null';
    btn.scrollIntoView({ block: 'center' });
    const r = btn.getBoundingClientRect();
    return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
  })()`);
  if (b === 'null') throw new Error('Post按钮没找到');
  const { x, y } = JSON.parse(b);
  for (const ty of ['mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type: ty, x, y, button: 'left', clickCount: 1 });
  await sleep(12000);
  const res = await cdp.eval(`JSON.stringify({ url: location.href, anchor: document.body.innerHTML.includes('aivideogeneratorfree.org'), err: (document.querySelector('.messages--error, [role=alert]') || {}).innerText || '', title: document.title })`);
  console.log('posted:', res);
  await shot('pe_posted');
} catch (e) { console.error('ERR', e.message); await shot('pe_err').catch(() => {}); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
