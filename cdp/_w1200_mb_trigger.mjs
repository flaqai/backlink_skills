// _w1200_mb_trigger.mjs — win1200: micro.blog 触发magic-link登录邮件
import { CDP } from './CDP.mjs';
import { typeSmart } from './cdp-type.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
  await cdp.send('Page.navigate', { url: 'https://micro.blog/' });
  await sleep(10000);
  const entry = await cdp.eval(`JSON.stringify([...document.querySelectorAll('a, button')].filter(e => e.offsetParent !== null).map(e => ({ t: (e.innerText || '').trim().slice(0, 20), h: e.href || '' })).filter(x => /log.?in|sign.?in/i.test(x.t)).slice(0, 5))`);
  console.log('entry:', entry);
  const E = JSON.parse(entry);
  if (!E.length) throw new Error('无登录入口');
  if (E[0].h) await cdp.send('Page.navigate', { url: E[0].h });
  await sleep(8000);
  const f = await cdp.eval(`JSON.stringify({
    url: location.href.slice(0, 90),
    inputs: [...document.querySelectorAll('input')].filter(e => e.offsetParent !== null).map(e => ({ t: e.type, n: e.name, ph: (e.placeholder || '').slice(0, 30) })),
    btns: [...document.querySelectorAll('button, input[type=submit]')].filter(e => e.offsetParent !== null).map(e => (e.innerText || e.value || '').trim()).slice(0, 6)
  })`);
  console.log('form:', f);
  const F = JSON.parse(f);
  const em = F.inputs.find(x => x.t === 'email' || /mail/.test(x.n || ''));
  if (!em) throw new Error('无邮箱框: ' + JSON.stringify(F.inputs));
  const sel = em.n ? `input[name="${em.n}"]` : 'input[type="email"]';
  await typeSmart(cdp, sel, 'microblog@92ng.com', { verify: false });
  // 点提交(Continue/Next/Log in)
  const b = await cdp.eval(`(() => {
    const btn = [...document.querySelectorAll('button, input[type=submit]')].find(x => /continue|next|log.?in|sign.?in/i.test(x.innerText || x.value || '') && x.offsetParent !== null);
    if (!btn) return 'null';
    btn.scrollIntoView({ block: 'center' });
    const r = btn.getBoundingClientRect();
    return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
  })()`);
  const B = JSON.parse(b);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: B.x, y: B.y });
  await sleep(120);
  for (const ty of ['mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type: ty, x: B.x, y: B.y, button: 'left', clickCount: 1 });
  await sleep(8000);
  console.log('after:', await cdp.eval(`JSON.stringify({ url: location.href.slice(0, 90), body: document.body.innerText.replace(/\\s+/g, ' ').slice(0, 200) })`));
  await shot('mb_trigger');
} catch (e) { console.error('ERR', e.message); await shot('mb_err').catch(() => {}); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
