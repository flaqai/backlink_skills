// _w1200_pe_post2.mjs — win1200: posteezy 发文v2(真实按键解锁antibot)
import { CDP } from './CDP.mjs';
import { typeSmart } from './cdp-type.mjs';
import { readFileSync } from 'fs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TITLE = 'AI Video Generator Free: What Free Tiers Actually Give You in 2026';
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
  await cdp.send('Page.navigate', { url: 'https://posteezy.com/node/add/article' });
  await sleep(10000);
  // antibot 字段侦察
  const ab = await cdp.eval(`JSON.stringify({ antibot: !!document.querySelector('input[name^="antibot"]'), antibotVal: (document.querySelector('input[name^="antibot"]') || {}).value || '', formLen: document.querySelectorAll('form').length })`);
  console.log('antibot:', ab);

  // 标题: typeSmart 逐键真打
  await typeSmart(cdp, 'input[name="title[0][value]"]', TITLE);
  console.log('title typed+verified');
  await sleep(1000);

  // 正文: 点进textarea→insertText(可信input事件)
  await cdp.eval(`(() => { const e = document.querySelector('textarea[name="body[0][value]"]'); e.style.display = 'block'; e.style.visibility = 'visible'; e.scrollIntoView({ block: 'center' }); e.focus(); })()`);
  await sleep(500);
  await cdp.send('Input.insertText', { text: body });
  await sleep(1500);
  console.log('body-len:', await cdp.eval(`document.querySelector('textarea[name="body[0][value]"]').value.length`));

  // tags: typeSmart
  await typeSmart(cdp, 'input[name="field_tags[target_id]"]', 'ai video, free tools, video generator', { verify: false });
  await sleep(800);

  // antibot 复查(打字后应已解锁)
  console.log('antibot-after:', await cdp.eval(`(document.querySelector('input[name^="antibot"]') || {}).value || 'none'`));

  // Post
  const b = await cdp.eval(`(() => {
    const btn = [...document.querySelectorAll('button, input[type=submit]')].find(x => /^post$/i.test((x.innerText || x.value || '').trim()) && x.offsetParent !== null);
    if (!btn) return 'null';
    btn.scrollIntoView({ block: 'center' });
    const r = btn.getBoundingClientRect();
    return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
  })()`);
  const { x, y } = JSON.parse(b);
  for (const ty of ['mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type: ty, x, y, button: 'left', clickCount: 1 });
  await sleep(12000);
  const res = await cdp.eval(`JSON.stringify({ url: location.href, anchor: document.body.innerHTML.includes('aivideogeneratorfree.org'), title: document.title.slice(0, 80) })`);
  console.log('posted:', res);
  await shot('pe_posted2');
} catch (e) { console.error('ERR', e.message); await shot('pe_err').catch(() => {}); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
