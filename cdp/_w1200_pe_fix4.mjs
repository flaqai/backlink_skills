// _w1200_pe_fix3.mjs — win1200: posteezy 正文补写终版(CK4+表单域内保存按钮)
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
  await cdp.send('Page.navigate', { url: 'https://posteezy.com/node/11197934/edit' });
  await sleep(12000);
  await cdp.eval(`CKEDITOR.instances['edit-body-0-value'].setData(${JSON.stringify(body)})`);
  await sleep(2000);
  console.log('data-len:', await cdp.eval(`CKEDITOR.instances['edit-body-0-value'].getData().length`));
  // 表单域内找保存按钮
  const b = await cdp.eval(`(() => {
    const form = document.querySelector('#edit-body-0-value').closest('form');
    const btn = [...form.querySelectorAll('input[type=submit], button')].find(x => /save|post/i.test((x.innerText || x.value || '').trim()) && !/search/i.test(x.innerText || x.value || ''));
    if (!btn) return 'null';
    btn.scrollIntoView({ block: 'center' });
    const r = btn.getBoundingClientRect();
    return JSON.stringify({ id: btn.id, txt: (btn.innerText || btn.value || '').trim(), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
  })()`);
  console.log('btn:', b);
  if (b === 'null') throw new Error('表单内无保存按钮');
  const B = JSON.parse(b);
  await sleep(8000);
  const b2 = await cdp.eval(\`(() => { const form = document.querySelector('#edit-body-0-value').closest('form'); const btn = [...form.querySelectorAll('input[type=submit], button')].find(x => /save|post/i.test((x.innerText || x.value || '').trim()) && !/search/i.test(x.innerText || x.value || '')); if (!btn) return 'null'; btn.scrollIntoView({ block: 'center' }); const r = btn.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }); })()\`);
  const B = JSON.parse(b2);
  await sleep(150);
  for (const ty of ['mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type: ty, x: B.x, y: B.y, button: 'left', clickCount: 1 });
  await sleep(13000);
  console.log('after:', await cdp.eval(`JSON.stringify({ url: location.href.slice(0, 130), hasAnchor: document.body.innerHTML.includes('aivideogeneratorfree.org'), msg: (document.querySelector('[data-drupal-messages], .messages') || {}).innerText || '' })`));
  await shot('pe_final3');
} catch (e) { console.error('ERR', e.message); await shot('pe_err').catch(() => {}); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
