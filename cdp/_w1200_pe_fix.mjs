// _w1200_pe_fix.mjs — win1200: posteezy 编辑页 CKEditor setData 补正文+锚链
import { CDP } from './CDP.mjs';
import { readFileSync } from 'fs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let body = readFileSync('D:/Github/backlink_skills/blog-articles/ai-video-generator-free/article.html', 'utf8').trim();
body = body.replace(/<!--[\s\S]*?-->/g, '');

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
  // 从发表页拿 node id
  await cdp.send('Page.navigate', { url: 'https://posteezy.com/ai-video-generator-free-what-free-tiers-actually-give-you-2026' });
  await sleep(10000);
  const nid = await cdp.eval(`(() => { const a = document.querySelector('a[href*="/edit"]'); const m = a ? a.href.match(/node\\/(\\d+)\\/edit/) : null; return m ? m[1] : 'null'; })()`);
  console.log('nid:', nid);
  if (nid === 'null') throw new Error('node id找不到');
  await cdp.send('Page.navigate', { url: `https://posteezy.com/node/${nid}/edit` });
  await sleep(12000);
  // CKEditor 实例探测
  const ck = await cdp.eval(`(() => {
    const el = document.querySelector('.ck-editor__editable');
    const inst = el && el.ckeditorInstance;
    return JSON.stringify({ ck5: !!inst, hasData: inst ? inst.getData().length : 0, textareaVal: (document.querySelector('#edit-body-0-value') || {}).value ? 'set' : 'empty' });
  })()`);
  console.log('ck-state:', ck);
  const C = JSON.parse(ck);
  if (C.ck5) {
    await cdp.eval(`(() => { const el = document.querySelector('.ck-editor__editable'); el.ckeditorInstance.setData(${JSON.stringify(body)}); })()`);
    await sleep(2000);
    console.log('after-set:', await cdp.eval(`document.querySelector('.ck-editor__editable').ckeditorInstance.getData().length`));
  } else {
    // 无CK5: textarea直接设(可能无编辑器)
    await cdp.eval(`(() => { const e = document.querySelector('#edit-body-0-value'); const set = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set; set.call(e, ${JSON.stringify(body)}); e.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  }
  // 8秒 honeypot 等待已在路上; 保存
  const b = await cdp.eval(`(() => {
    const btn = document.querySelector('#edit-submit');
    if (!btn) return 'null';
    btn.scrollIntoView({ block: 'center' });
    const r = btn.getBoundingClientRect();
    return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
  })()`);
  await sleep(8000);
  const { x, y } = JSON.parse(b);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(150);
  for (const ty of ['mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type: ty, x, y, button: 'left', clickCount: 1 });
  await sleep(12000);
  console.log('after-save:', await cdp.eval(`JSON.stringify({ url: location.href.slice(0, 120), hasAnchor: document.body.innerHTML.includes('aivideogeneratorfree.org'), msg: (document.querySelector('.messages--status, [data-drupal-messages]') || {}).innerText || '' })`));
  await shot('pe_fixed');
} catch (e) { console.error('ERR', e.message); await shot('pe_err').catch(() => {}); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
