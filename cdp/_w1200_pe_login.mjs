// _w1200_pe_login.mjs — win1200: posteezy 重登(typeSmart治丢字符)→node/add/article表单侦察
import { CDP } from './CDP.mjs';
import { typeSmart } from './cdp-type.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const EMAIL = 'posteezy@92ng.com';
const PASS = 'Xx@Posteezy26!Xm';

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
  // 1) 首页查登录态
  await cdp.send('Page.navigate', { url: 'https://posteezy.com/' });
  await sleep(10000);
  const logged = await cdp.eval(`JSON.stringify({ logged: !!document.querySelector('a[href*="logout"], a[href*="user/logout"]'), body: document.body.innerText.slice(0, 120) })`);
  console.log('home:', logged);

  if (JSON.parse(logged).logged !== true) {
    // 2) 登录
    await cdp.send('Page.navigate', { url: 'https://posteezy.com/user/login' });
    await sleep(10000);
    const form = await cdp.eval(`JSON.stringify([...document.querySelectorAll('input')].filter(e => e.offsetParent !== null).map(e => ({ t: e.type, n: e.name, id: e.id })))`);
    console.log('form:', form);
    const F = JSON.parse(form);
    const nameInp = F.find(x => /name|mail/i.test(x.n || '') && (x.t === 'text' || x.t === 'email'));
    const passInp = F.find(x => x.t === 'password');
    if (!nameInp || !passInp) throw new Error('登录表单字段缺失');
    const css = (x) => x.id ? `#${x.id}` : `input[name="${x.n}"]`;
    await typeSmart(cdp, css(nameInp), EMAIL);
    await typeSmart(cdp, css(passInp), PASS);
    await shot('pe_filled');
    const b = await cdp.eval(`(() => {
      const btn = [...document.querySelectorAll('button, input[type=submit]')].find(x => /log.?in|sign.?in/i.test(x.innerText || x.value || '') && x.offsetParent !== null);
      if (!btn) return 'null';
      btn.scrollIntoView({ block: 'center' });
      const r = btn.getBoundingClientRect();
      return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
    })()`);
    if (b === 'null') throw new Error('登录按钮没找到');
    const { x, y } = JSON.parse(b);
    for (const ty of ['mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type: ty, x, y, button: 'left', clickCount: 1 });
    await sleep(9000);
    const chk = await cdp.eval(`JSON.stringify({ url: location.href, logged: !!document.querySelector('a[href*="logout"], a[href*="user/logout"]'), err: (document.querySelector('.messages--error, [role=alert]') || {}).innerText || '' })`);
    console.log('after-login:', chk);
  }

  // 3) node/add/article 表单侦察
  await cdp.send('Page.navigate', { url: 'https://posteezy.com/node/add/article' });
  await sleep(10000);
  const nf = await cdp.eval(`JSON.stringify({
    url: location.href,
    inputs: [...document.querySelectorAll('input')].filter(e => e.offsetParent !== null).map(e => ({ t: e.type, n: e.name, ph: (e.placeholder || '').slice(0, 30) })).slice(0, 10),
    textareas: [...document.querySelectorAll('textarea')].map(e => ({ n: e.name, vis: e.offsetParent !== null, ck: !!document.querySelector('.ck-editor__editable') })),
    ck: document.querySelectorAll('.ck-editor__editable').length,
    save: [...document.querySelectorAll('button, input[type=submit]')].filter(e => e.offsetParent !== null).map(e => (e.innerText || e.value || '').trim()).filter(Boolean).slice(0, 8)
  })`);
  console.log('node-form:', nf);
  await shot('pe_nodeform');
} catch (e) { console.error('ERR', e.message); await shot('pe_err').catch(() => {}); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
